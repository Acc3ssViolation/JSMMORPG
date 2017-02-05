using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Server
{
    public class Client
    {
        public string m_name;
        public TcpClient m_tcpClient;
        public bool m_isWebSocket;
    }
}
