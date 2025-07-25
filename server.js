const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const stream = require('stream');
const cors = require('cors');

// --- KONFIGURASI SERVER ---
const PORT = 3000;
const KEYFILEPATH = './credentials.json'; // Path ke file kunci JSON Anda
const FOLDER_ID = '1-9PM8cnqW9KDnr79-BgC3Q2pfDJd1J6X'; // Ganti dengan ID folder Drive Anda
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const app = express();

// Middleware
app.use(cors()); // Mengizinkan request dari frontend
const upload = multer(); // Menggunakan memory storage

// Otentikasi dengan Google
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

// Endpoint untuk upload
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const { buffer, originalname, mimetype } = req.file;

    // Buat buffer stream
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    const response = await drive.files.create({
      requestBody: {
        name: originalname,
        parents: [FOLDER_ID],
      },
      media: {
        mimeType: mimetype,
        body: bufferStream,
      },
      fields: 'id,name',
    });

    console.log(`File uploaded successfully: ${response.data.name} (ID: ${response.data.id})`);
    res.status(200).json({ success: true, fileName: response.data.name });
  } catch (error) {
    console.error('Error uploading file:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});