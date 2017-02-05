using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Math;

namespace Server.Game
{
    /// <summary>
    /// A train that runs horizontally across the map
    /// </summary>
    public class Train : NetworkedEntity
    {
        public SyncedValue<Vector2> serverPos = new SyncedValue<Vector2>();
        public SyncedValue<Vector2> serverVel = new SyncedValue<Vector2>();

        //TODO: Handle server side collisions and stuff

        public override void Start()
        {
            serverVel.value = new Vector2(10, 0);
        }

        public override void Update()
        {
            serverPos.value += serverVel.value * Time.deltaTime;
            if(serverPos.value.x > 201)
            {
                serverPos.value.x = -60;
            }
            else if(serverPos.value.y < -61)
            {
                serverPos.value.x = 200;
            }
        }

        public override string ToString()
        {
            return "Train (" + id + ") at pos " + serverPos.value.ToString() + " vel " + serverVel.value.ToString();
        }
    }
}
