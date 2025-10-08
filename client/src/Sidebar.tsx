import React from "react";
import { useSidebar } from "./SidebarProvider";
import { Link } from "wouter";

export const Sidebar = () => {
  const { isOpen, toggle } = useSidebar();

  return (
    <>
      {/* Toggle Button (visible on all screens) */}
      <button
        className="p-2 fixed top-4 left-4 z-50 bg-gray-800 text-white rounded"
        onClick={toggle}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-gray-900 text-white
          transform transition-transform duration-300 ease-in-out z-40 w-64
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">IoT Sidebar</h2>
          {/* Desktop toggle button also visible */}
          <button
            className="p-1 hover:bg-gray-700 rounded"
            onClick={toggle}
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isOpen ? "←" : "→"}
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {/* <Link href="/">
            <span className="block px-2 py-1 rounded hover:bg-gray-700 cursor-pointer">Dashboard</span>
          </Link> */}
          <Link href="/">
            <span className="block px-2 py-1 rounded hover:bg-gray-700 cursor-pointer">Controller</span>
          </Link>
          <Link href="/electrolyzer">
            <span className="block px-2 py-1 rounded hover:bg-gray-700 cursor-pointer">Electrolyzer</span>
          </Link>
        </nav>
      </aside>
    </>
  );
};
