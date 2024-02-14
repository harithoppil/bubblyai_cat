"use server";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { outputFile } from "image-data-uri";
import { existsSync, mkdirSync, createReadStream } from "node:fs";

const openai = new OpenAI({
  apiKey: "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",
});

export async function POST(req, res) {
  const { content } = await req.json();
  const image1Base64 = content[0].image1;
  const image2Base64 = content[1].image2;

  //const buffer1 = Buffer.from(imageData1, "base64");
  //code for buffers if necesaary in future

  const tempDir = __dirname + "/temp";

  if (!existsSync(tempDir)) {
    mkdirSync(tempDir);
  }
  const getRandomInt = function (max) {
    return Math.floor(Math.random() * max);
  };
  const image1Path = tempDir + "/image" + getRandomInt(100) + ".png";
  const image2Path = tempDir + "/image" + getRandomInt(100) + ".png";
  console.log("server log ", image1Path);
  // LEARN WHY filesync did not work/ methods to achieve without filesave like buffers/cache etc..
  await outputFile(image1Base64, image1Path)
    .then((savedFilePath1) => {
      console.log("Image1 saved :", savedFilePath1);
    })
    .catch((error) => {
      console.error("Error saving image1", error);
    });
  await outputFile(image2Base64, image2Path)
    .then((savedFilePath2) => {
      console.log("Image2 saved :", savedFilePath2);
    })
    .catch((error) => {
      console.error("Error saving image2: ", error);
    });

  const file1 = await createReadStream(image1Path);
  const file2 = await createReadStream(image2Path);
  console.log(file1);
  const response = await openai.images.edit({
    image: file1,
    mask: file2,
    model: "dall-e-2",
    prompt: "An Image with a striped red cat",
    n: 1,
    size: "1024x1024",
  });
  //response_format: "b64_json", // ---USE FOR Base64 openai

  // const imageUrl = await response.data[0].url;
  const imageUrl = await response.data[0];
  //  response.data && response.data.length > 0 ? await response.data[0].url : "";
  //console.error("server log ", imageUrl);
  if (imageUrl) {
    return NextResponse.json(imageUrl, { status: 200 });
    //return NextResponse;
  }
}
