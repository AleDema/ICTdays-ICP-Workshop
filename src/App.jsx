import { useEffect, useState, useRef } from 'react';
import Canvas from './components/Canvas';
import './index.css';
import motokoLogo from './assets/motoko_moving.png';
import motokoShadowLogo from './assets/motoko_shadow.png';
import reactLogo from './assets/react.svg';
import { backend } from './declarations/backend';
import { storage } from './declarations/storage';


async function getUint8Array(file) {
  const arrayBuffer = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function () {
      resolve(reader.result);
    };
    reader.onerror = function () {
      reject(reader.error);
    };
    reader.readAsArrayBuffer(file);
  });
  const uint8Array = new Uint8Array(arrayBuffer);
  console.log('Uint8Array:', uint8Array);
  return uint8Array
}

function App() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const [uploaded, setUploaded] = useState(null);

  function handleFileUpload(event) {
    const selectedFile = event.target.files[0];
    console.log(selectedFile)
    validateFile(selectedFile);
  }

  function handleDrop(event) {
    handleFileUpload(event)
    setDragging(false);
  }

  function handleDragOver(event) {
    event.preventDefault();
    setDragging(true);
  }

  function handleDragEnter(event) {
    event.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setDragging(false);
  }

  function validateFile(file) {
    const maxSize = 1024 * 1024 * 10; // 10 MB
    if (file.size > maxSize) {
      setError('File size exceeds 10 MB');
      setFile(null);
    } else {
      setError(null);
      setFile(file);
    }
  }

  const uploadImage = async () => {
    console.log(file)
    let chunk_ids = [];
    let batch_id = Math.random().toString(36).substring(2, 7);

    const uploadChunk = async ({ chunk, order }) => {
      return storage.create_chunk(batch_id, chunk, order);
    };
    const asset_unit8Array = await getUint8Array(file)
    console.log(asset_unit8Array)
    const promises = [];
    const chunkSize = 2000000;

    for (
      let start = 0, index = 0;
      start < asset_unit8Array.length;
      start += chunkSize, index++
    ) {
      const chunk = asset_unit8Array.slice(start, start + chunkSize);
      console.log(chunk)
      promises.push(
        uploadChunk({
          chunk,
          order: index,
        })
      );
    }

    chunk_ids = await Promise.all(promises);


    const asset_filename = file.name;
    // const response = await fetch(file);
    // const blob = await response.blob();
    // const type = blob.type;
    const asset_content_type = file.type
    const { ok: asset_id } = await storage.commit_batch(
      batch_id,
      chunk_ids,
      {
        filename: asset_filename,
        content_encoding: "gzip",
        content_type: asset_content_type,
      }
    );

    const { ok: asset } = await storage.get(asset_id);
    console.log(asset);
    setUploaded(asset.url)
  }

  const mintNft = async () => {

  }


  return (
    <div className="">
      <button onClick={uploadImage}>Test upload</button>
      <button onClick={mintNft}>Mint NFT</button>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={dragging ? 'dragging' : ''}
      >
        <input type="file" onChange={handleFileUpload} />
        {error && <p>{error}</p>}
        {file && <p>Selected file: {file.name}</p>}
        {uploaded && <img src={uploaded}></img>}
      </div>
    </div>
  );
}

export default App;
