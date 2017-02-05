using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Server.Game
{
    public static class Time
    {
        public static float deltaTime { get; private set; }

        private static int m_interval;

        public static int interval
        {
            get
            {
                return m_interval;
            }
            set
            {
                m_interval = value;
                deltaTime = m_interval / 1000.0f;
            }
        }
    }
}
