using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Reflection;

namespace Server.Game
{
    public class NetworkedEntity
    {
        private Dictionary<string, dynamic> m_syncedValues;

        public int id;
        public bool started;

        public NetworkedEntity()
        {
            m_syncedValues = new Dictionary<string, dynamic>();
            var fields = GetType().GetRuntimeFields().Where((info) => {
                if(Util.IsSubclassOfRawGeneric(typeof(SyncedValue<>), info.FieldType))
                    return true;
                return false;
            });
            //Output.WriteLine("FIELD COUNT OF TYPE " + GetType() + " : " + fields.Length);
            foreach(var field in fields)
            {
                //Output.WriteLine("FIELD " + field.Name + " HAS TYPE: " + field.FieldType);
                dynamic value = field.GetValue(this);

                value.Initialize(this, field.Name);
                m_syncedValues.Add(field.Name, value);
            }
        }

        public virtual void Start()
        {

        }

        public virtual void Update()
        {

        }

        public virtual void Destroyed()
        {

        }

        public void TrySetSyncedValue(string field, dynamic value)
        {
            dynamic dynSyncVal;
            if(m_syncedValues.TryGetValue(field, out dynSyncVal))
            {
                try
                {
                    if(!CustomSetValue(dynSyncVal, value))
                    {
                        dynSyncVal.value = value;
                    }
                }
                catch(Exception e)
                {
                    Output.WriteLine("Exception doing stuff with synced shit: " + e.Message);
                }
            }
        }

        private bool CustomSetValue(dynamic dynSyncVal, dynamic value)
        {
            Type t = dynSyncVal.GetType().GetGenericArguments()[0];
            if(t == typeof(Math.Vector2))
            {
                dynSyncVal.value = new Math.Vector2((float)value["x"], (float)value["y"]);
                return true;
            }
            if(t == typeof(int))
            {
                dynSyncVal.value = (int)value;
                return true;
            }
            if(t == typeof(float))
            {
                dynSyncVal.value = (float)value;
                return true;
            }

            return false;
        }
    }
}
