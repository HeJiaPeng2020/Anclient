﻿using io.odysz.anclient;
using io.odysz.semantic.jprotocol;
using io.odysz.semantics;
using System;
using System.Collections.Generic;
using System.IO;
using System.Windows.Forms;

namespace io.odysz.anclient.example.revit
{
    class Core
    {
        /// <summary>
        /// f.gltf : [f.gltf, f.bin]
        /// </summary>
        /// <param name="gltf"></param>
        /// <param name="uiwedget"></param>
        /// <returns></returns>
        public static List<string> Gltfilenames(string filename, System.Windows.Forms.Control winFormText = null)
        {
            List<string> currentFiles = new List<string>();
            if (".gltf" == Path.GetExtension(filename))
            {
                string directory = Path.GetDirectoryName(filename) + "\\";
                string gltf = Path.GetFileName(filename);
                string glb = Path.GetFileNameWithoutExtension(gltf) + ".bin";
                if (winFormText != null)
                    winFormText.Text = filename + " -> " + glb;
                currentFiles = new List<string> { filename, Path.Combine(directory, glb) };
            }
            else
            {
                if (winFormText != null)
                    winFormText.Text = filename;
                currentFiles = new List<string>() { filename };
            }
            return currentFiles;
        }

        public static void uploadUi(AnsonClient client, string uid, List<string> currentFiles, Action<SemanticObject> onOk = null)
        {
            // upload to a_attaches
            if (client == null)
                MessageBox.Show("Please connect first.", "Upload With UI");
            else
            {
                client.AttachFiles(currentFiles, "a_users", uid, (c, d) => {
                    SemanticObject resulved = (SemanticObject)((AnsonResp)d).Map("resulved");
                    if (onOk != null)
                        onOk(resulved);
                });
            }
        }
    }
}