import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import WritingPanel from "./components/Writing/WritingPanel";
import TimelinePanel from "./components/Timeline/TimelinePanel";
import AnalysisPanel from "./components/Analytics/AnalysisPanel";

const App = () => (
  <Router>
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/writing" />} />
        <Route path="/writing" element={<WritingPanel />} />
        <Route path="/timeline" element={<TimelinePanel />} />
        <Route path="/analysis" element={<AnalysisPanel />} />
      </Routes>
    </Layout>
  </Router>
);

export default App;
