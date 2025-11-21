import { HashRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { PromptCapturePage } from "@/pages/PromptCapturePage";

const App = () => (
  <HashRouter>
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="/prompt" element={<PromptCapturePage />} />
    </Routes>
  </HashRouter>
);

export default App;

