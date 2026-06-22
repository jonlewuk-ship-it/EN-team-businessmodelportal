export default async function handler(request, response) {
  // 1. Grab the single marketplace Redis URL variable
  const redisConnectionString = process.env.KV_REST_API_URL || process.env.REDIS_URL;

  if (!redisConnectionString) {
    return response.status(500).json({ 
      error: "Missing database configuration. Please add KV_REST_API_URL to your Vercel Environment Variables." 
    });
  }

  // 2. Parse out the endpoint and token automatically from the single connection string
  let kvUrl = "";
  let kvToken = "";

  try {
    // Expected format: redis://default:token@host:port or rediss://...
    const cleanUrlStr = redisConnectionString.replace(/^redis/i, 'http');
    const parsed = new URL(cleanUrlStr);
    
    kvUrl = `https://${parsed.host}`;
    kvToken = parsed.password || parsed.pathname.split('/')[1] || "";
  } catch (e) {
    // If it's already a clean HTTP address from manual entry fallback gracefully
    kvUrl = redisConnectionString;
    kvToken = process.env.KV_REST_API_TOKEN || "";
  }

  // Fallback blueprint data used if database is empty
  const defaultMarkets = [
    {name:"United Kingdom", city:"London", code:"gb", img:"https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200", url:"https://collaborative-bmc.vercel.app/canvas/1phfrx5eh3a0hbooly4pw7rjfq75ec76", custom:false},
    {name:"Australia", city:"Sydney", code:"au", img:"https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200", url:"#", custom:false},
    {name:"Canada", city:"Toronto", code:"ca", img:"https://images.unsplash.com/photo-1507992781348-3102a57a4ac4?w=1200", url:"#", custom:false},
    {name:"USA", city:"New York", code:"us", img:"https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200", url:"#", custom:false},
    {name:"Ireland", city:"Dublin", code:"ie", img:"https://images.unsplash.com/photo-1549918838-7c899fafb15d?w=1200", url:"#", custom:false},
    {name:"Poland", city:"Warsaw", code:"pl", img:"https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1200", url:"#", custom:false},
    {name:"India", city:"Mumbai", code:"in", img:"https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200", url:"#", custom:false},
    {name:"UAE", city:"Dubai", code:"ae", img:"https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200", url:"#", custom:false},
    {name:"Slovakia", city:"Bratislava", code:"sk", img:"https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=1200", url:"#", custom:false}
  ];

  async function runKvCommand(commandArray) {
    const baseUrl = kvUrl.endsWith('/') ? kvUrl.slice(0, -1) : kvUrl;

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${kvToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(commandArray)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Database rejected command: ${errText}`);
    }

    const reply = await res.json();
    return reply.result;
  }

  try {
    const { method } = request;

    if (method === 'GET') {
      const storedData = await runKvCommand(['GET', 'acca_global_workspaces']);
      if (!storedData) {
        await runKvCommand(['SET', 'acca_global_workspaces', JSON.stringify(defaultMarkets)]);
        return response.status(200).json(defaultMarkets);
      }
      return response.status(200).json(typeof storedData === 'string' ? JSON.parse(storedData) : storedData);
    }

    if (method === 'POST') {
      const newWorkspace = request.body;
      const rawData = await runKvCommand(['GET', 'acca_global_workspaces']);
      let currentData = rawData ? (typeof rawData === 'string' ? JSON.parse(rawData) : rawData) : defaultMarkets;

      currentData.push(newWorkspace);
      await runKvCommand(['SET', 'acca_global_workspaces', JSON.stringify(currentData)]);
      return response.status(200).json(currentData);
    }

    if (method === 'DELETE') {
      const { index } = request.query;
      const rawData = await runKvCommand(['GET', 'acca_global_workspaces']);
      let currentData = rawData ? (typeof rawData === 'string' ? JSON.parse(rawData) : rawData) : defaultMarkets;

      if (index !== undefined) {
        currentData.splice(parseInt(index, 10), 1);
        await runKvCommand(['SET', 'acca_global_workspaces', JSON.stringify(currentData)]);
      }
      return response.status(200).json(currentData);
    }

    return response.status(405).json({ error: "Method not allowed" });

  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
