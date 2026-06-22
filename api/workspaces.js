// api/workspaces.js
import { kv } from '@vercel/kv';

// Complete market array reconstructed from image_8da7c6.png and active EN Team targets
const DEFAULT_WORKSPACES = [
  {
    name: "United Kingdom",
    city: "London",
    code: "gb",
    img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200",
    url: "https://collaborative-bmc.vercel.app/canvas...", // Kept deployment root from image_8da7c6.png
    custom: false
  },
  {
    name: "Japan",
    city: "Tokyo",
    code: "jp",
    img: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=1200",
    url: "#",
    custom: false
  },
  {
    name: "Australia",
    city: "Sydney",
    code: "au",
    img: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200",
    url: "#",
    custom: false
  },
  {
    name: "Canada",
    city: "Toronto",
    code: "ca",
    img: "https://images.unsplash.com/photo-1507992781348-3102a57a4ac4?w=1200",
    url: "#",
    custom: false
  },
  {
    name: "USA",
    city: "New York",
    code: "us",
    img: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200",
    url: "#",
    custom: false
  },
  {
    name: "Ireland",
    city: "Dublin",
    code: "ie",
    img: "https://images.unsplash.com/photo-1549918838-7c899fafb15d?w=1200",
    url: "#",
    custom: false
  },
  {
    name: "Poland",
    city: "Warsaw",
    code: "pl",
    img: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1200",
    url: "#",
    custom: false
  },
  {
    name: "India",
    city: "Mumbai",
    code: "in",
    img: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200",
    url: "#",
    custom: false
  },
  {
    name: "UAE",
    city: "Dubai",
    code: "ae",
    img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200",
    url: "#",
    custom: false
  },
  {
    name: "Slovakia",
    city: "Bratislava",
    code: "sk",
    img: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=1200",
    url: "#",
    custom: false
  }
];

export default async function handler(req, res) {
  const STORAGE_KEY = 'en_team_workspaces_2026';

  try {
    let workspaces = await kv.get(STORAGE_KEY);
    if (!workspaces) {
      await kv.set(STORAGE_KEY, DEFAULT_WORKSPACES);
      workspaces = DEFAULT_WORKSPACES;
    }

    switch (req.method) {
      case 'GET':
        return res.status(200).json(workspaces);

      case 'POST':
        const newEntry = req.body;
        if (!newEntry || !newEntry.name || !newEntry.code) {
          return res.status(400).json({ error: "Invalid payload architecture." });
        }
        workspaces.push(newEntry);
        await kv.set(STORAGE_KEY, workspaces);
        return res.status(200).json(workspaces);

      case 'DELETE':
        const { index } = req.query;
        if (index === undefined || index < 0 || index >= workspaces.length) {
          return res.status(400).json({ error: "Target out of bounds or missing." });
        }
        workspaces.splice(index, 1);
        await kv.set(STORAGE_KEY, workspaces);
        return res.status(200).json(workspaces);

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not permissible.` });
    }
  } catch (error) {
    console.error("Vercel KV REST Proxy Failure:", error);
    return res.status(500).json({ error: "Storage backend pipeline error." });
  }
}
