using Math;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSockets;

namespace Server.Game
{
    public class GameController
    {
        class MessageBuffer
        {
            public List<SpawnEntry> spawns = new List<SpawnEntry>();
            public List<UpdateEntry> updates = new List<UpdateEntry>();
            public List<RemoveEntry> removals = new List<RemoveEntry>();

            public void Clear()
            {
                spawns.Clear();
                updates.Clear();
                removals.Clear();
            }
        }

        Dictionary<Client, Player> m_players;
        Dictionary<int, NetworkedEntity> m_entities;
        private static Random random = new Random();
        public static GameController instance { get; private set; }

        private List<Vector2> m_spawnPoints;
        private int m_spawnIndex = 0;

        public event Action eventPreMessageBuilding;

        MessageBuffer m_sendBuffer;
        MessageBuffer m_recieveBuffer;


        public GameController()
        {
            if(instance == null)
            {
                instance = this;
            }
            m_sendBuffer = new MessageBuffer();
            m_recieveBuffer = new MessageBuffer();
            m_players = new Dictionary<Client, Player>();
            m_entities = new Dictionary<int, NetworkedEntity>();

            m_spawnPoints = new List<Vector2>();
            m_spawnPoints.Add(new Vector2(10, 10));

            // TEST
            var train = SpawnNetworked<Train>();
            train.serverPos.value = new Vector2(-60, 5.5f);
           // train = SpawnNetworked<Train>();
            //train.serverPos.value = new Vector2(120, 5.5f);
        }

        /// <summary>
        /// Connects a client and creates their player object.
        /// </summary>
        /// <param name="newClient"></param>
        public void ConnectClient(Client newClient)
        {
            if(m_players.ContainsKey(newClient))
            {
                throw new Exception("Client already in dictionary!");
            }

            Player newPlayer = SpawnNetworked<Player>();
            newPlayer.owner = newClient;
            m_players.Add(newClient, newPlayer);

            newPlayer.serverPos.value = m_spawnPoints[m_spawnIndex];
            m_spawnIndex = (m_spawnIndex + 1) % m_spawnPoints.Count;

            // Send spawn message
            GamePlayerSpawnedMessage playerMessage = new GamePlayerSpawnedMessage();

            playerMessage.playerEntityId = newPlayer.id;
            playerMessage.serverName = Server.config.Name;
            playerMessage.serverMessage = Server.config.Message;

            var frame = new Frame();
            frame.SetPayload(JsonConvert.SerializeObject(playerMessage, Formatting.None));
            frame.Write(newClient.m_tcpClient.GetStream());

            // Send existing entities to client now
            GameMessage newClientMessage = new GameMessage();

            foreach(var entity in m_entities.Values)
            {
                if(entity == newPlayer)
                    continue;

                newClientMessage.spawns.Add(new SpawnEntry
                {
                    entityId = entity.id,
                    type = entity.GetType().Name,
                    values = entity.GetAllKVPairs()
                });
            }
            frame = new Frame();
            frame.SetPayload(JsonConvert.SerializeObject(newClientMessage, Formatting.None));
            frame.Write(newClient.m_tcpClient.GetStream());

            // Add name message
            m_sendBuffer.updates.Add(new UpdateEntry
            {
                entityId = newPlayer.id,
                values = newPlayer.GetAllKVPairs()
            });


            Output.WriteLine("GC: Connected client " + newClient.m_name);
        }

        /// <summary>
        /// Disconnects the client and removes their player object.
        /// </summary>
        /// <param name="client"></param>
        public void DisconnectClient(Client client)
        {
            Player player;
            if(m_players.TryGetValue(client, out player))
            {
                m_players.Remove(client);
                DestroyNetworked(player.id);
            }            
        }

        /// <summary>
        /// Spawns a NetworkedEntity of type.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <returns></returns>
        public T SpawnNetworked<T>() where T : NetworkedEntity, new()
        {
            var id = random.Next();
            while(m_entities.ContainsKey(id))
            {
                id = random.Next();
            }
            T entity = new T();
            entity.id = id;
            m_entities.Add(id, entity);

            m_sendBuffer.spawns.Add(new SpawnEntry() {
                entityId = id,
                type = typeof(T).Name,
            });

            return entity;
        }

        public void DestroyNetworked(int id)
        {
            NetworkedEntity entity;
            if(m_entities.TryGetValue(id, out entity))
            {
                m_entities.Remove(id);
                entity.Destroyed();
                m_sendBuffer.removals.Add(new RemoveEntry {
                    entityId = id,
                    immediate = true
                });
            }
        }

        public NetworkedEntity FindNetworkedEntity(int id)
        {
            NetworkedEntity entity;
            if(m_entities.TryGetValue(id, out entity))
            {
                return entity;
            }
            return null;
        }

        public void Update()
        {
            // handle incoming updates and stuff
            foreach(var update in m_recieveBuffer.updates)
            {
                var entity = FindNetworkedEntity(update.entityId);
                if(entity != null)
                {
                    // SLOOOOW
                    //entity.
                    foreach(var val in update.values)
                    {
                        entity.TrySetSyncedValue(val.Key, val.Value);
                    }
                }
            }

            // do local update
            foreach(var entity in m_entities)
            {
                if(!entity.Value.started)
                {
                    entity.Value.Start();
                    entity.Value.started = true;
                }
                entity.Value.Update();
            }

            m_recieveBuffer.Clear();
        }

        public void SendMessage()
        {
            if(m_players.Count < 1)
                return;

            eventPreMessageBuilding?.Invoke();

            var frame = new Frame();

            var message = new GameMessage();
            message.spawns = m_sendBuffer.spawns;
            message.updates = m_sendBuffer.updates;
            message.removals = m_sendBuffer.removals;

            frame.SetPayload(JsonConvert.SerializeObject(message, Formatting.None));
            var frameBytes = frame.GetBytes();

            foreach(var player in m_players)
            {
                try
                {
                    var stream = player.Value.owner.m_tcpClient.GetStream();
                    stream.Write(frameBytes, 0, frameBytes.Length);
                }
                catch(Exception e)
                {
                    Output.WriteLine("Exception sending update to client:\r\n" + e.Message);
                }
            }

            m_sendBuffer.Clear();
        }

        public void AddUpdate(UpdateEntry update)
        {
            m_sendBuffer.updates.Add(update);
        }

        public void AddRecievedMessage(GameMessage message)
        {
            m_recieveBuffer.spawns.AddRange(message.spawns);
            m_recieveBuffer.updates.AddRange(message.updates);
            m_recieveBuffer.removals.AddRange(message.removals);
        }

        public void DebugOutput()
        {
            Output.WriteLine("Player count: " + m_players.Count);
            foreach(var player in m_players)
            {
                Output.WriteLine(player.Value.owner.m_name + " - at pos: " + player.Value.serverPos.value.ToString());
            }
            Output.WriteLine("Entity count: " + m_entities.Count);
            foreach(var entity in m_entities)
            {
                Output.WriteLine(entity.Value.ToString());
            }
        }
    }
}
