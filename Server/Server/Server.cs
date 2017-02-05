using Newtonsoft.Json;
using Server.Game;
using System;
using System.Collections.Concurrent;
using System.Net;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using WebSockets;

namespace Server
{
    class Server
    {
        /// <summary>
        /// Minimum amount of bytes that have to be available before we start processing it.
        /// </summary>
        int m_minMessageLength = 3;

        ConcurrentQueue<Client> m_activeClients;
        Config m_config;
        Thread m_listenerThread;
        Thread[] m_processingThreads;

        bool m_keepRunning;

        public void Start()
        {
            m_keepRunning = true;
            m_config = new Config();

            Output.WriteLine("Starting server " + m_config.Name);

            m_activeClients = new ConcurrentQueue<Client>();
            // Ensure game controller exists
            GameController controller = new GameController();

            Output.WriteLine("Starting TCP listener thread...");
            m_listenerThread = new Thread(RunListener);
            m_listenerThread.Start();
            m_processingThreads = new Thread[m_config.ProcessThreadCount];
            for(int i = 0; i < m_processingThreads.Length; i++)
            {
                Output.WriteLine("Starting processing thread " + i + "...");
                m_processingThreads[i] = new Thread(RunProcessor);
                m_processingThreads[i].Start();
            }

            Output.WriteLine("Startup completed!");


            using(Timer gameTimer = new Timer((s) =>
            {
                lock(GameController.instance)
                {
                    controller.Update();
                    controller.SendMessage();
                    controller.DebugOutput();
                }
            }, null, 0, 100))
            {
                //TESt
                Player p = new Player();
                //
                m_listenerThread.Join();
            }


            // DO TESt
            /*Message testMessage = new Message();
            testMessage.SetPayload(Encoding.UTF8.GetBytes("TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND TITS AND ASS AND "));
            Output.WriteLine("Written as: " + testMessage.GetMessage());
            var bytes = testMessage.CreateFrame();

            Message readerMessage = new Message(bytes);
            Output.WriteLine("Read as: " + readerMessage.GetMessage());*/

            // block
            
        }

        void RunListener()
        {
            TcpListener listener = new TcpListener(IPAddress.Parse(m_config.IPAddress), m_config.Port);
            listener.Start();
            Output.WriteLine("Listening at " + m_config.IPAddress + ":" + m_config.Port);
            while(m_keepRunning)
            {
                var client = listener.AcceptTcpClient();
                Output.WriteLine("Accepted client...");

                Client webClient = new Client();
                webClient.m_name = "Client X";
                webClient.m_tcpClient = client;

                m_activeClients.Enqueue(webClient);
            }
            listener.Stop();
        }

        void RunProcessor()
        {
            while(m_keepRunning)
            {
                bool shouldRequeue = true;

                Client client;
                while(!m_activeClients.TryDequeue(out client))
                {
                }
                NetworkStream stream = null;
                try
                {
                    stream = client.m_tcpClient.GetStream();
                }
                catch(Exception e)
                {
                    lock(GameController.instance)
                    {
                        GameController.instance.DisconnectClient(client);
                    }
                    shouldRequeue = false;
                    client.m_tcpClient.Close();
                    continue;
                }
                if(stream.DataAvailable)
                {
                    while(client.m_tcpClient.Available < m_minMessageLength)
                    {
                        Output.WriteLine("!");
                    }

                    byte[] bytes = new byte[client.m_tcpClient.Available];
                    stream.Read(bytes, 0, bytes.Length);

                    if(!client.m_isWebSocket)
                    {
                        // Handshake
                        string str = Encoding.UTF8.GetString(bytes);
                        if(new Regex("^GET").IsMatch(str))
                        {
                            // Handshake according to https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_server
                            byte[] response = Encoding.UTF8.GetBytes("HTTP/1.1 101 Switching Protocols" + Environment.NewLine
                            + "Connection: Upgrade" + Environment.NewLine
                            + "Upgrade: websocket" + Environment.NewLine
                            + "Sec-WebSocket-Accept: " + Convert.ToBase64String(
                                SHA1.Create().ComputeHash(
                                    Encoding.UTF8.GetBytes(
                                        new Regex("Sec-WebSocket-Key: (.*)").Match(str).Groups[1].Value.Trim() + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
                                    )
                                )
                            ) + Environment.NewLine
                            + Environment.NewLine);

                            stream.Write(response, 0, response.Length);

                            Output.WriteLine(client.m_name + " is now using WebSockets");
                            client.m_isWebSocket = true;
                        }
                    }
                    else
                    {
                        var msg = new Frame(bytes);
                        if(msg.OpCode == Frame.Opcode.Text)
                        {
                            var stri = msg.GetMessage();
                            //Output.WriteLine(stri);
                            try
                            {
                                dynamic messageObject = JsonConvert.DeserializeObject(stri);
                                unchecked
                                {
                                    if(messageObject.type == "con_start")
                                    {
                                        Output.WriteLine("Recieved con_start msg");
                                        client.m_name = messageObject.username;

                                        lock(GameController.instance)
                                        {
                                            GameController.instance.ConnectClient(client);
                                        }
                                    }
                                    else if(messageObject.type == "game_update")
                                    {
                                        Output.WriteLine("Got game_update from " + client.m_name);

                                        var gameMessage = JsonConvert.DeserializeObject<GameMessage>(stri);
                                        lock(GameController.instance)
                                        {
                                            GameController.instance.AddRecievedMessage(gameMessage);
                                        }
                                    }
                                }
                            }
                            catch(Exception e)
                            {
                                Output.WriteLine("Exception when deserializing message:\r\n" + e.Message + "\r\n" + e.StackTrace);
                            }
                        }
                        else if(msg.OpCode == Frame.Opcode.Ping)
                        {
                            Output.WriteLine("Got pinged, ponging...");
                            var response = new Frame();
                            response.SetPayload(msg.Payload);
                            response.OpCode = Frame.Opcode.Pong;
                            response.Write(stream);
                        }
                        else if(msg.OpCode == Frame.Opcode.Close)
                        {
                            // Close connection
                            var response = new Frame();
                            response.SetPayload(msg.Payload);
                            response.OpCode = Frame.Opcode.Close;
                            response.Write(stream);

                            lock(GameController.instance)
                            {
                                GameController.instance.DisconnectClient(client);
                            }

                            client.m_tcpClient.Close();
                            shouldRequeue = false;

                            Output.WriteLine("Closed connection with client " + client.m_name);
                        }
                    }
                }
                if(shouldRequeue)
                {
                    m_activeClients.Enqueue(client);
                }
            }
        }
    }
}
