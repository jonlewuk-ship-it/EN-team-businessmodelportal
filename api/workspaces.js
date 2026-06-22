// A secure, zero-dependency HTTP storage bucket for your workspaces
const KV_BUCKET_URL = "https://kvdb.io/K99b6BBN2x58pC6SUpXN9U/acca_workspaces";

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

export default async function handler(request, response) {
  try {
    const { method } = request;

    // --- GET: FETCH WORKSPACES ---
    if (method === 'GET') {
      const res = await fetch(KV_BUCKET_URL);
      
      if (res.status === 404) {
        // Initialize if the bucket is empty
        await fetch(KV_BUCKET_URL, {
          method: 'POST',
          body: JSON.stringify(defaultMarkets)
        });
        return response.status(200).json(defaultMarkets);
      }

      const data = await res.json();
      return response.status(200).json(data);
    }

    // --- POST: ADD NEW WORKSPACE ---
    if (method === 'POST') {
      const newWorkspace = request.body;
      const getRes = await fetch(KV_BUCKET_URL);
      let currentData = getRes.status === 200 ? await getRes.json() : defaultMarkets;

      currentData.push(newWorkspace);
      
      await fetch(KV_BUCKET_URL, {
        method: 'POST',
        body: JSON.stringify(currentData)
      });
      return response.status(200).json(currentData);
    }

    // --- DELETE: REMOVE WORKSPACE ---
    if (method === 'DELETE') {
      const { index } = request.query;
      const getRes = await fetch(KV_BUCKET_URL);
      let currentData = getRes.status === 200 ? await getRes.json() : defaultMarkets;

      if (index !== undefined) {
        currentData.splice(parseInt(index, 10), 1);
        await fetch(KV_BUCKET_URL, {
          method: 'POST',
          body: JSON.stringify(currentData)
        });
      }
      return response.status(200).json(currentData);
    }

    return response.status(405).json({ error: "Method not allowed" });

  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
