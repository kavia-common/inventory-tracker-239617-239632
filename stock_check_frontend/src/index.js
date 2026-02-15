import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { createAppRouter } from "./router";

const root = ReactDOM.createRoot(document.getElementById("root"));

const router = createAppRouter();

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
