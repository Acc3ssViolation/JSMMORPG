using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Math;

namespace Server.Game
{
    public class Player : NetworkedEntity
    {
        public Client owner;
        public SyncedValue<Vector2> serverPos           = new SyncedValue<Vector2>();
        public SyncedValue<Vector2> serverTargetTile    = new SyncedValue<Vector2>();
        public SyncedValue<int> serverFaceDir           = new SyncedValue<int>();

        public override List<KeyValuePair<string, object>> GetAllKVPairs()
        {
            var list = base.GetAllKVPairs();
            list.Add(new KeyValuePair<string, object>("displayName", owner.m_name));
            return list;
        }
    }
}
