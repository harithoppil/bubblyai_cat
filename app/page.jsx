"use client";
//import Image from "next/image";


import { React, useEffect, useState, useRef } from "react";
export default function Home() {
  //Learn about ways to reduce overcrowding of states/ maybe use objects vs primitivs?
  const abortControllerRef = useRef(null);
  const [originalImage, setOriginalImage] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [modImage, setmodImage] = useState(false);
  const [urlImage, seturlImage] = useState('');
  const [loading, setloading] = useState(false)
  const [percent, setpercent] = useState(0)
  const canvasRef = useRef(null);
  useEffect(() => {
    //learn more about useEffect..
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const handleMouseMove = (event) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      ctx.lineTo(offsetX, offsetY);
      ctx.lineWidth = '30';
      ctx.globalCompositeOperation = 'destination-out'
      //refer html5 canvas paint github for more features
      ctx.lineJoin = 'round';
      ctx.lineCap = "round";
      ctx.stroke();
    };
    const handleMouseDown = (event) => {
      setIsDrawing(true);
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
    };
    const handleMouseUp = () => {
      setIsDrawing(false);

    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDrawing]);
  const fileSelected = (event) => {
    seturlImage('')
    setmodImage(false)
    const file = event.target.files[0];
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setOriginalImage(canvas.toDataURL());
    };
  };

  const downloadOriginal = (name) => {
    seturlImage('')
    setmodImage(false)
    const link = document.createElement('a');
    link.download = `${name}.png`;
    link.href = originalImage;
    link.click();
  };
  const downloadMask = (name) => {
    seturlImage('')
    setmodImage(false)
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `${name}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const encodeb64 = function encode(data, mediaType) {
    // USE FOR B64 imgs going with url/client render for now.. 
    if (!data || !mediaType) {
      console.log('ImageDataURI :: Error :: Missing some of the required params: data, mediaType ');
      return null;
    }

    mediaType = (/\//.test(mediaType)) ? mediaType : 'image/' + mediaType;
    let dataBase64 = (Buffer.isBuffer(data)) ? data.toString('base64') : new Buffer(data).toString('base64');
    let dataImgBase64 = 'data:' + mediaType + ';base64,' + dataBase64;

    return dataImgBase64;
  }
  const handleOpenAI = async () => {
    setloading(true)
    setpercent(25)
    const canvas = canvasRef.current;
    const editedImage = canvas.toDataURL();
    const formData = new FormData();
    formData.append('image1', originalImage);
    formData.append('image2', editedImage);

    const content = [{ image1: originalImage }, { image2: editedImage }]
    abortControllerRef.current = new AbortController();



    setpercent(30)
    const res = await fetch("/api/imageEdit", {
      method: "POST",
      //cache: 'no-store',
      body: JSON.stringify({ content }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok || !res.body) {
      setpercent(35)
      console.error('Oops.. seems like no json')
      setpercent(99)
      setloading(false)
      setpercent(0)
    } else {
      setpercent(35)


      const data = await res.json()
      const url = data.url
      seturlImage(url)
      setmodImage(true)
      console.log('data log', url)

      setpercent(99)
      setloading(false)
      setpercent(0)
    }
  };



  const heading =
    [(<h2 className="text-center" style={{ font: 'Roboto', color: '#101213', fontSize: '36px', fontWeight: '600', textAlign: 'center' }}> DALL-E 2 Image Mask Editors </h2>),
    (<p hidden={!originalImage.length} className="text-center">2. Use mouse to erase parts of the photo that should be edited by AI</p>),
    (<p hidden={!originalImage.length} className="text-center">  3. Send to  OpenAI</p>),
    (<p hidden={!originalImage.length} className="text-center">  4. Download Images</p>)];

  const imageSelector = (
    <div className="input-group mb-3">
      <label className="input-group-text" htmlFor="inputGroupFile01">Upload</label>
      <input type="file" className="form-control" accept="image/*" onChange={fileSelected} id="inputGroupFile01" /></div>);

  const imageRenderCanvas = (
    <div hidden={!originalImage.length} style={{ width: '100%', margin: "10", height: '100%', minwidth: '1400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <canvas hidden={modImage} ref={canvasRef} className="border border-white" ></canvas>
      <img hidden={!modImage} src={urlImage} alt="Cat Image" />

    </div>);



  const openAIButton = (
    <div hidden={!originalImage.length} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <button disabled={!originalImage.length} type="button" className="btn m-2 btn-outline-primary" onClick={handleOpenAI}>
        <span hidden={!loading} className="spinner-border spinner-border-sm" role="status" aria-hidden={!loading}></span>
        {loading ? ' Loading...' : "AI Mod Image!"}
      </button></div>);
  const progressBar = (
    <div hidden={!loading} className="progress" role="progressbar" aria-label="Animated striped example" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100">
      <div hidden={!loading} className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: "75%" }} />
    </div>
  );
  const imageDownloadButtons = (
    <div hidden={!originalImage.length} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <button disabled={!originalImage.length} type="button" className="btn m-2 btn-outline-primary" onClick={() => downloadOriginal("Original")}>Download Original</button>
      <button disabled={!originalImage.length} type="button" className="btn m-2 btn-outline-primary" onClick={() => downloadMask("Mask")}>Download Mask</button></div>);


  return (
    <div style={{ backgroundImage: 'linear-gradient(30deg, #4B39EF, #EE8B60)', height: "100vh", width: "100vw", display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: 'white', borderRadius: 20, border: 10, padding: 20, height: "auto", width: "60%" }}>

        {heading[0]}
        <br />
        {imageSelector}
        {heading[1]}
        {imageRenderCanvas}
        { }
        <br />
        {heading[2]}
        {openAIButton}
        {progressBar}
        <br />
        {heading[3]}
        {imageDownloadButtons}
      </div>
    </div>
  );
}
