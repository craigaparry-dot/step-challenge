"use client";

import { signInWithPopup, User } from "firebase/auth";
import { auth, provider, db } from "../lib/firebase";
import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), { ssr: false });

const TOTAL_DISTANCE = 10000;

const milestones = [
  { name: "Leicester", distance: 0 },
  { name: "Liverpool", distance: 200 },
  { name: "Dublin", distance: 400 },
  { name: "Galway", distance: 600 },
  { name: "Mid-Atlantic", distance: 3000 },
  { name: "Newfoundland", distance: 5000 },
  { name: "Quebec", distance: 6500 },
  { name: "Toronto", distance: 8000 },
  { name: "New York", distance: 9500 },
  { name: "MetLife Stadium", distance: 10000 }
];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [steps, setSteps] = useState("");
  const [totalSteps, setTotalSteps] = useState(0);
  const [distance, setDistance] = useState(0);
  const [progress, setProgress] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState("Leicester");
  const [nextLocation, setNextLocation] = useState("Liverpool");
  const [lastMilestone, setLastMilestone] = useState<string | null>(null);
  const [notification, setNotification] = useState("");

  const signIn = async () => {
    const result = await signInWithPopup(auth, provider);
    setUser(result.user);
  };

  const submitSteps = async () => {
    if (!steps || !user) return;

    await addDoc(collection(db, "steps"), {
      userId: user.uid,
      name: user.displayName,
      steps: Number(steps),
      date: new Date().toISOString().split("T")[0],
      timestamp: new Date()
    });

    setSteps("");
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "steps"), (snapshot) => {
      let total = 0;
      const userTotals: any = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        total += data.steps;

        if (!userTotals[data.name]) userTotals[data.name] = 0;
        userTotals[data.name] += data.steps;
      });

      setTotalSteps(total);

      const distanceKm = total * 0.0008;
      setDistance(Number(distanceKm.toFixed(2)));
      setProgress(Number(((distanceKm / TOTAL_DISTANCE) * 100).toFixed(1)));

      const leaderboardArray = Object.entries(userTotals)
        .map(([name, steps]) => ({ name, steps }))
        .sort((a, b) => (b.steps as number) - (a.steps as number));

      setLeaderboard(leaderboardArray);

      let current = milestones[0];
      let next = milestones[1];

      for (let i = 0; i < milestones.length; i++) {
        if (distanceKm >= milestones[i].distance) {
          current = milestones[i];
          next = milestones[i + 1] || milestones[i];
        }
      }

      setCurrentLocation(current.name);
      setNextLocation(next.name);

      setLastMilestone((prev) => {
        if (current.name !== prev) {
          if (prev !== null) {
            setNotification(`🎉 You've reached ${current.name}!`);
            setTimeout(() => setNotification(""), 3000);
          }
          return current.name;
        }
        return prev;
      });
    });

    return () => unsubscribe();
  }, []);

  const userIndex = leaderboard.findIndex(
    (entry) => user && entry.name === user.displayName
  );

  const userRank = userIndex >= 0 ? userIndex + 1 : null;

  const leaderSteps = leaderboard[0]?.steps || 0;
  const userSteps = userIndex >= 0 ? leaderboard[userIndex].steps : 0;

  const gapToLeader = leaderSteps - userSteps;

  return (
    <div
      style={{
        padding: 20,
        width: "100%",
        maxWidth: 1400,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
        background: "#f9fafb",
        minHeight: "100vh",
        color: "#111"
      }}
    >
      <h1 style={{ fontSize: "28px", marginBottom: "5px" }}>
        🏆 Walk to the World Cup
      </h1>

      <p style={{ color: "#555", marginBottom: "10px" }}>
        Track your team's journey from Leicester to the final
      </p>

      {notification && (
        <div
          style={{
            background: "#0070f3",
            color: "white",
            padding: "10px",
            borderRadius: "8px",
            marginBottom: "15px",
            textAlign: "center"
          }}
        >
          {notification}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(300px, 400px) 1fr",
          gap: "20px"
        }}
      >
        {/* LEFT PANEL */}
        <div
          style={{
            background: "#ffffff",
            color: "#111",
            borderRadius: "12px",
            padding: "15px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
          }}
        >
          <h2>Total Steps</h2>
          <p style={{ fontSize: "22px", fontWeight: "bold" }}>
            {totalSteps}
          </p>

          <h3>{distance} km travelled</h3>
          <h3>{progress}% complete</h3>

          <p>
            📍 {currentLocation} → {nextLocation}
          </p>

          {user && userRank && (
            <div
              style={{
                background: "#e6f7ff",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "15px"
              }}
            >
              <strong>You are #{userRank}</strong><br />
              {userRank === 1
                ? "You're leading! 🥇"
                : `${gapToLeader} steps behind leader`}
            </div>
          )}

          {!user ? (
            <>
              <p style={{ color: "#666" }}>Log in to contribute 👇</p>
              <button
                onClick={signIn}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#0070f3",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                Sign in with Google
              </button>
            </>
          ) : (
            <>
              <p>Welcome {user?.displayName}</p>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <input
                  type="number"
                  placeholder="Enter steps"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                />

                <button
                  onClick={submitSteps}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "green",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                >
                  Submit
                </button>
              </div>
            </>
          )}
        </div>

        {/* MAP */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
          }}
        >
          <Map progress={progress} />
        </div>
      </div>

      {/* LEADERBOARD */}
      <div
        style={{
          marginTop: 20,
          background: "#ffffff",
          borderRadius: "12px",
          padding: "15px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}
      >
        <h2>🏆 Leaderboard</h2>

        {leaderboard.map((entry, index) => {
          const isUser = user && entry.name === user.displayName;

          return (
            <div
              key={index}
              style={{
                padding: "8px",
                borderRadius: "6px",
                background: isUser ? "#e6f7ff" : "transparent"
              }}
            >
              {index + 1}. {entry.name} — {entry.steps}
              {isUser && " (You)"}
            </div>
          );
        })}
      </div>
    </div>
  );
}