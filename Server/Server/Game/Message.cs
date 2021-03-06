﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Server.Game
{
    public class Message
    {
        public string type;
    }

    public class GameMessage : Message
    {
        public List<SpawnEntry> spawns = new List<SpawnEntry>();
        public List<UpdateEntry> updates = new List<UpdateEntry>();
        public List<RemoveEntry> removals = new List<RemoveEntry>();

        public GameMessage()
        {
            type = "game_update";
        }
    }

    public class ConnectionStartMessage : Message
    {
        public string username;

        public ConnectionStartMessage()
        {
            type = "con_start";
        }
    }

    public class GamePlayerSpawnedMessage : Message
    {
        public int playerEntityId;
        public string serverName;
        public string serverMessage;

        public GamePlayerSpawnedMessage()
        {
            type = "game_player_spawned";
        }
    }

    public struct UpdateEntry
    {
        public int entityId;
        public List<KeyValuePair<string, object>> values;
    }

    public struct SpawnEntry
    {
        public int entityId;
        public string type;
        public List<KeyValuePair<string, object>> values;
    }

    public struct RemoveEntry
    {
        public int entityId;
        public bool immediate;
    }
}
