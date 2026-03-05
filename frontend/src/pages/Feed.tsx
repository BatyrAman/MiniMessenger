import { useEffect, useState } from "react";
import { api } from "../api/http";

type Post = {
  id: string;
  author_id: string;
  caption?: string | null;
  created_at: string;
  media: { url: string; media_type: "image" | "video"; sort_order: number }[];
};

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    api<Post[]>("/feed").then(setPosts).catch((e)=>console.error(e));
  }, []);

  return (
    <div style={{ maxWidth: 520, margin: "20px auto" }}>
      <h2>Feed</h2>
      {posts.map(p => (
        <div key={p.id} style={{ border: "1px solid #ddd", borderRadius: 12, marginBottom: 16 }}>
          {p.media?.[0]?.media_type === "image" && (
            <img src={p.media[0].url} style={{ width: "100%", display: "block", borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
          )}
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(p.created_at).toLocaleString()}</div>
            <div style={{ marginTop: 8 }}>{p.caption}</div>
          </div>
        </div>
      ))}
    </div>
  );
}