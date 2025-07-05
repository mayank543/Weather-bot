import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './index.css';
// import { GoogleOAuthProvider } from "@react-oauth/google";
import { ClerkProvider } from '@clerk/clerk-react';


// Import your Publishable Key
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkKey) {
  throw new Error('Missing Publishable Key')
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    
      <ClerkProvider publishableKey={clerkKey}>
      <App />
    </ClerkProvider>
    
  </React.StrictMode>
);