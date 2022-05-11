import "dotenv/config";
import FormData from "form-data";
import fs from "fs";
import fetch from "isomorphic-unfetch";
import path from "path";

// Filenames are formatted like `{001} - {prompt}.png`
// Start and end number allows the script to batch upload them using the number
// at the start of the filename
const START_NUMBER = 114;
const END_NUMBER = 200;
const images = fs.readdirSync("./scripts/content");

const TOKEN = process.env.CMS_TOKEN || "";
const endpoint = process.env.CMS_ENDPOINT || "";

function parsePromptFilename(filename: string) {
  let basename;
  if (filename.endsWith(".png")) {
    basename = path.basename(filename, ".png");
  }
  if (filename.endsWith(".jpg")) {
    basename = path.basename(filename, ".jpg");
  }
  if (filename.endsWith(".gif")) {
    basename = path.basename(filename, ".gif");
  }

  if (basename) {
    const [number, prompt] = basename.split(" - ");
    const num = parseInt(number, 10);

    // Only return the prompt if the image is within the correct range
    if (num >= START_NUMBER && num <= END_NUMBER) return prompt;
  }
}

// Mutation for adding the prompt once the file has been uploaded to the CMS
const updatePromptMutation = `
  mutation UpdatePrompt($id: ID, $prompt: String) {
    updateAsset(where: { id: $id }, data: { prompt: $prompt }) {
      id
      prompt
    }
  }
`;

// Upload an image file to the CMS, and then add the correct prompt
async function uploadImage(filename: string) {
  // Get the prompt
  const prompt = parsePromptFilename(filename);

  if (prompt) {
    // Upload the image file to the CMS
    const filePath = path.join("./scripts/content", filename);
    const image = fs.createReadStream(filePath);
    const form = new FormData();
    form.append("fileUpload", image);
    form.append("prompt", prompt);

    console.log(`Uploading: ${filePath}`);
    const uploadRes = await fetch(`${endpoint}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}` },
      // @ts-ignore
      body: form,
    }).then((res: any) => res.json());

    // If it was successfully uploaded, then add the prompt
    const id = uploadRes.id;
    if (id) {
      console.log(`Adding prompt "${prompt}" for id "${id}"`);
      await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}` },
        body: updatePromptMutation,
      }).then(() => {
        console.log("Added prompt for", id);
      });
    }
  }
}

// Run the thing
(async () => {
  for (const imageFilename of images) {
    await uploadImage(imageFilename);
  }
})();
