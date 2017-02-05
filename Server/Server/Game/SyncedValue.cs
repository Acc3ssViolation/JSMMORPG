using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Server.Game
{
    public class SyncedValue<T> where T : new()
    {
        private NetworkedEntity m_entity;
        private string m_identifier;
        private bool m_dirty;
        private T m_value;

        public T value
        {
            get
            {
                return m_value;
            }
            set
            {
                m_dirty = true;
                m_value = value;
            }
        }

        public SyncedValue()
        {
            m_value = new T();

            GameController.instance.eventPreMessageBuilding += OnMessageBuildStart;
        }

        public void Initialize(NetworkedEntity entity, string identifier)
        {
            m_entity = entity;
            m_identifier = identifier;
        }

        ~SyncedValue()
        {
            GameController.instance.eventPreMessageBuilding -= OnMessageBuildStart;
        }

        private void OnMessageBuildStart()
        {
            if(!m_dirty)
                return;

            GameController.instance.AddUpdate(new UpdateEntry() {
                entityId = m_entity.id,
                values = new KeyValuePair<string, object>[] {
                    new KeyValuePair<string, object>(m_identifier, m_value)
                }
            });

            m_dirty = false;
        }

        public void Parse(object value)
        {

        }
    }
}
