import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Personnes } from "./pages/Personnes";
import { Familles } from "./pages/Familles";
import { Unions } from "./pages/Unions";
import { Arbres } from "./pages/Arbres";
import { NotFound } from "./pages/Notfound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "personnes", Component: Personnes },
      { path: "familles", Component: Familles },
      { path: "unions", Component: Unions },
      { path: "arbres", Component: Arbres },
      { path: "*", Component: NotFound },
    ],
  },
]);
