import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import FittingWizard from "./pages/FittingWizard";
import Chartes from "./pages/Chartes";
import Outils from "./pages/Outils";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/fitting" element={<FittingWizard />} />
        <Route path="/fitting/:id" element={<FittingWizard />} />
        <Route path="/chartes" element={<Chartes />} />
        <Route path="/outils" element={<Outils />} />
      </Routes>
    </Layout>
  );
}
