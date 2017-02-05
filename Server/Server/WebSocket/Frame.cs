using Server;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSockets
{
    public class Frame
    {
        public enum Opcode
        {
            Continuation,
            Text,
            Binary,
            Ping,
            Pong,
            Close
        }
        public bool FIN { get; set; }
        public bool MASK { get; set; }
        public Opcode OpCode { get; set; }
        public ulong PayloadLength { get; private set; }
        public byte[] MaskKey { get; set; }
        public byte[] Payload { get; private set; }

        /// <summary>
        /// Creates a new single frame, unmasked message with text payload.
        /// </summary>
        public Frame()
        {
            FIN = true;
            OpCode = Opcode.Text;
            MASK = false;
            MaskKey = null;
            PayloadLength = 0;
            Payload = null;
        }

        /// <summary>
        /// Decodes an array of bytes into a WebSocket message.
        /// </summary>
        public Frame(byte[] bytes)
        {
            // FIN bit
            FIN = (bytes[0] & 0x80) > 0;
            // Opcode
            if((bytes[0] & 0x0F) == 0x0)
            {
                OpCode = Opcode.Continuation;
            }
            else if((bytes[0] & 0x0F) == 0x1)
            {
                OpCode = Opcode.Text;
            }
            else if((bytes[0] & 0x0F) == 0x2)
            {
                OpCode = Opcode.Binary;
            }
            else if((bytes[0] & 0x0F) == 0x8)
            {
                OpCode = Opcode.Close;
            }
            else if((bytes[0] & 0x0F) == 0x9)
            {
                OpCode = Opcode.Ping;
            }
            else if((bytes[0] & 0x0F) == 0xA)
            {
                OpCode = Opcode.Pong;
            }
            else
            {
                // Nope
                throw new FormatException("Unknown opcode!");
            }
            // Mask
            MASK = (bytes[1] & 0x80) > 0;
            int firstMaskByte = 2;
            // Payload length
            var length = (ushort)(bytes[1] & 0x7F);
            if(length <= 125)
            {
                PayloadLength = length;
            }
            else if(length == 126)
            {
                ushort high = (ushort)(bytes[2] << 8);
                ushort low = bytes[3];

                PayloadLength = (ushort)(high | low);

                firstMaskByte = 4;
            }
            else if(length == 127)
            {
                ulong longLength = (((ulong)bytes[2]) << 56)
                                 | (((ulong)bytes[3]) << 48)
                                 | (((ulong)bytes[4]) << 40)
                                 | (((ulong)bytes[5]) << 32)
                                 | (((ulong)bytes[6]) << 24)
                                 | (((ulong)bytes[7]) << 16)
                                 | (((ulong)bytes[8]) << 8)
                                 | (((ulong)bytes[9]) << 0);
                PayloadLength = longLength;

                firstMaskByte = 10;
            }

            // Mask key
            int firstPayloadByte = firstMaskByte;
            if(MASK)
            {
                MaskKey = new byte[4];
                MaskKey[0] = bytes[firstMaskByte + 0];
                MaskKey[1] = bytes[firstMaskByte + 1];
                MaskKey[2] = bytes[firstMaskByte + 2];
                MaskKey[3] = bytes[firstMaskByte + 3];
                firstPayloadByte = firstMaskByte + 4;
            }

            // Payload
            Payload = new byte[PayloadLength];
            Array.Copy(bytes, firstPayloadByte, Payload, 0, (long)PayloadLength);

            if(MASK)
            {
                DecodePayload();
            }

            /*Output.WriteLine("FIN: " + FIN + "\r\n" +
                "Opcode: " + OpCode.ToString() + "\r\n" +
                "Length: " + PayloadLength);
            if(MASK)
            {
                Output.WriteLine("Mask: " + MaskKey[0] + "," + MaskKey[1] + "," + MaskKey[2] + "," + MaskKey[3] + "\r\n");
            }*/
        }

        private void DecodePayload()
        {
            for(int i = 0; i < Payload.Length; i++)
            {
                Payload[i] = (byte)(Payload[i] ^ MaskKey[i % 4]);
            }
        }

        /// <summary>
        /// Returns the payload as a UTF-8 encoded string.
        /// </summary>
        public string GetMessage()
        {
            return Encoding.UTF8.GetString(Payload);
        }

        /// <summary>
        /// Creates the frame for this message
        /// </summary>
        public byte[] GetBytes()
        {
            List<byte> bytes = new List<byte>();
            // FIN and Opcode
            byte workingByte = GetOpcodeByte(OpCode);
            //Output.WriteLine("Opcode byte: " + workingByte);
            if(FIN)
            {
                workingByte |= 0x80;
                //Output.WriteLine("Opcode byte w FIN: " + workingByte);
            }
            bytes.Add(workingByte);

            // Mask bit and payload
            if(PayloadLength <= 125)
            {
                workingByte = (byte)PayloadLength;
                if(MASK)
                {
                    workingByte |= 0x80;
                }
                bytes.Add(workingByte);
            }
            else if(PayloadLength <= 65535)
            {
                workingByte = 126;
                if(MASK)
                {
                    workingByte |= 0x80;
                }
                bytes.Add(workingByte);
                bytes.Add((byte)(PayloadLength >> 8));
                bytes.Add((byte)(PayloadLength));
            }
            else
            {
                workingByte = 127;
                if(MASK)
                {
                    workingByte |= 0x80;
                }
                bytes.Add(workingByte);
                bytes.Add((byte)(PayloadLength >> 56));
                bytes.Add((byte)(PayloadLength >> 48));
                bytes.Add((byte)(PayloadLength >> 40));
                bytes.Add((byte)(PayloadLength >> 32));
                bytes.Add((byte)(PayloadLength >> 24));
                bytes.Add((byte)(PayloadLength >> 16));
                bytes.Add((byte)(PayloadLength >> 8));
                bytes.Add((byte)(PayloadLength));
            }

            //Output.WriteLine("Payload byte: " + workingByte);
            //Output.WriteLine("Payload length: " + PayloadLength);

            // Mask
            if(MASK)
            {
                for(int i = 0; i < MaskKey.Length; i++)
                {
                    bytes.Add(MaskKey[i]);
                }
            }

            // Payload
            bytes.AddRange(Payload);

            return bytes.ToArray();
        }

        /// <summary>
        /// Writes this message to a stream.
        /// </summary>
        /// <param name="stream"></param>
        public void Write(Stream stream)
        {
            var frame = GetBytes();
            stream.Write(frame, 0, frame.Length);
        }

        /// <summary>
        /// Sets this message's payload. Does not affect opcode.
        /// </summary>
        public void SetPayload(byte[] payload)
        {
            PayloadLength = (ulong)payload.Length;
            Payload = payload;
        }

        /// <summary>
        /// Sets this message's payload. Sets opcode to text.
        /// </summary>
        public void SetPayload(string payload)
        {
            var bytes = Encoding.UTF8.GetBytes(payload);
            PayloadLength = (ulong)bytes.Length;
            Payload = bytes;
            OpCode = Opcode.Text;
        }

        /// <summary>
        /// Returns byte for opcode. Returns 0xFF on error.
        /// </summary>
        /// <param name="code"></param>
        /// <returns></returns>
        private static byte GetOpcodeByte(Opcode code)
        {
            switch(code)
            {
                case Opcode.Continuation:
                    return 0x00;
                case Opcode.Text:
                    return 0x01;
                case Opcode.Binary:
                    return 0x02;
                case Opcode.Ping:
                    return 0x09;
                case Opcode.Pong:
                    return 0x0A;
                default:
                    return 0xFF;
            }
        }
    }
}
