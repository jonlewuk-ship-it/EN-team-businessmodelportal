export default async function handler(request, response) {
const kvUrl = process.env.KV_REST_API_URL || process.env.REDIS_URL || process.env.STORAGE_URL;
const kvToken = process.env.KV_REST_API_TOKEN || process.env.REDIS_TOKEN || process.env.STORAGE_TOKEN;
  if (!kvUrl || !kvToken) {
    return response.status(500).json({ error: "Vercel Redis environment variables are missing." });
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

  async function runKvCommand(command, args) {
    const res = await fetch(`${kvUrl}/${command}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${kvToken}` },
      body: JSON.stringify(args)
    });
    const reply = await res.json();
    if (reply.error) throw new Error(reply.error);
    return reply.result;
  }

  try {
    // READ: Get all workspaces
    if (request.method === 'GET') {
      let data = await runKvCommand('get', ['acca_global_workspaces']);
      if (!data) {
        data = JSON.stringify(defaultMarkets);
        await runKvCommand('set', ['acca_global_workspaces', data]);
      }
      return response.status(200).json(JSON.parse(data));
    }
    // WRITE: Append a workspace
    if (request.method === 'POST') {
      const newWorkspace = request.body;
      let rawData = await runKvCommand('get', ['acca_global_workspaces']);
      let currentData = rawData ? JSON.parse(rawData) : defaultMarkets;
      currentData.push(newWorkspace);
      await runKvCommand('set', ['acca_global_workspaces', JSON.stringify(currentData)]);
      return response.status(200).json(currentData);
    }

    // DELETE: Remove workspace by index
    if (request.method === 'DELETE') {
      const { index } = request.query;
      if (index === undefined) return response.status(400).json({ error: "Missing index parameter" });
      let rawData = await runKvCommand('get', ['acca_global_workspaces']);
      let currentData = rawData ? JSON.parse(rawData) : defaultMarkets;
      currentData.splice(parseInt(index, 10), 1);
      await runKvCommand('set', ['acca_global_workspaces', JSON.stringify(currentData)]);
      return response.status(200).json(currentData);
    }

    return response.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return response.status(500).json({ error: err.message });
  }
}
