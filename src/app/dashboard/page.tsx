"use client";
import {useEffect,useState} from "react";
import {apiRequest} from "@/lib/api";

const cards=[
 ["Profile","Build one identity with multiple capabilities.","/profile/edit"],
 ["Creator Feed","Show work, discover creators and interact.","/feed"],
 ["Discover","Search people, jobs, services and listings.","/search"],
 ["Jobs","Jobs, internships, freelance and gigs.","/jobs"],
 ["Marketplace","Products, property, vehicles and services.","/marketplace"],
 ["Collaborate","Send and manage collaboration requests.","/collaborations"],
];

export default function Dashboard(){
 const [user,setUser]=useState<any>(null);
 useEffect(()=>{const t=localStorage.getItem("collabx_token");if(!t){location.href="/login";return}apiRequest<any>("/auth/me",{headers:{Authorization:`Bearer ${t}`}}).then(d=>setUser(d.user)).catch(()=>{localStorage.removeItem("collabx_token");location.href="/login"});},[]);
 function logout(){localStorage.removeItem("collabx_token");location.href="/login"}
 return <main className="min-h-screen bg-gray-50"><nav className="border-b bg-white px-6 py-4"><div className="mx-auto flex max-w-6xl items-center justify-between"><a href="/" className="text-xl font-bold">COLLABX</a><div className="flex items-center gap-4"><a href="/feed">Feed</a><a href="/search">Discover</a><button onClick={logout}>Logout</button></div></div></nav>
 <section className="mx-auto max-w-6xl px-6 py-12"><p className="text-sm font-semibold text-gray-500">EVERYTHING CONNECTS.</p><h1 className="mt-2 text-5xl font-bold">Welcome{user?.name?`, ${user.name}`:""}.</h1><p className="mt-4 max-w-2xl text-lg text-gray-600">One account for your profile, work, business, jobs, services and marketplace activity.</p>
 <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{cards.map(c=><a key={c[0]} href={c[2]} className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-md"><h2 className="text-xl font-bold">{c[0]}</h2><p className="mt-2 text-gray-600">{c[1]}</p><span className="mt-6 inline-block font-semibold">Open →</span></a>)}</div>
 <div className="mt-10 rounded-3xl bg-black p-8 text-white"><p className="text-sm opacity-70">COLLABX AI</p><h2 className="mt-2 text-3xl font-bold">Ask for a connection.</h2><p className="mt-2 opacity-80">AI search and matching are the next intelligence layer of the platform.</p><a href="/search" className="mt-5 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-black">Try universal search</a></div>
 </section></main>;
}
