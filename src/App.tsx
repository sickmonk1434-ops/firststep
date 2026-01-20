
import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Admissions from "./pages/Admissions";
import Programs from "./pages/Programs";
import Gallery from "./pages/Gallery";
import FAQ from "./pages/FAQ";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="admissions" element={<Admissions />} />
            <Route path="programs" element={<Programs />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="login" element={<Login />} />
          </Route>
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </HashRouter>
    </>
  );
}

export default App;
