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
        public string Message { get; set; }
        public int ProcessThreadCount { get; set; }

        public Config()
        {
            IPAddress = "127.0.0.1";
            Port = 9998;
            Name = "Local Server";
            Message = "A test server for all sorts of testing. Science!";
            ProcessThreadCount = 1;
        }
    }
}
