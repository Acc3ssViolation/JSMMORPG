using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Server
{
    class Config
    {
        public string IPAddress { get; set; }
        public int Port { get; set; }
        public string Name { get; set; }
        public int ProcessThreadCount { get; set; }

        public Config()
        {
            IPAddress = "127.0.0.1";
            Port = 9998;
            Name = "Local Server";
            ProcessThreadCount = 2;
        }
    }
}
