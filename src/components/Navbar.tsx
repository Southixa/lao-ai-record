'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserButton } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { Button } from '@/components/ui/button';
import { FaMicrophone } from 'react-icons/fa';

const Navbar = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  
  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo and brand name */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <FaMicrophone className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-semibold text-blue-500">Lao-ai-record</span>
              </div>
            </Link>
          </div>

          {/* Middle navigation links - visible on md and larger screens */}
          <div className="hidden md:flex items-center space-x-4">
            <NavItem href="/ai-youtube">AI YOUTUBE</NavItem>
            <NavItem href="/presentation">PRESENTATION</NavItem>
            <NavItem href="/ai-pdf">AI PDF</NavItem>
            <NavItem href="/study">STUDY</NavItem>
            <NavItem href="/writer">WRITER</NavItem>
            <NavDropdown label="AI TOOLS" />
            <NavItem href="/pricing">PRICING</NavItem>
          </div>

          {/* Right side - Authentication buttons */}
          <div className="md:min-w-[180px] flex justify-end">
            <div className="flex items-center">
              {isLoading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded-md"></div>
              ) : isAuthenticated ? (
                <UserButton afterSignOutUrl="/" />
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/sign-in">
                    <Button variant="ghost" className="bg-gray-900 text-white hover:bg-gray-800">
                      LOGIN
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button variant="outline" className="bg-white hover:bg-gray-100">
                      SIGN UP
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Helper components
const NavItem = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-sm text-gray-600 hover:text-gray-900 font-medium px-1">
    {children}
  </Link>
);

const NavDropdown = ({ label }: { label: string }) => (
  <div className="relative group">
    <button className="text-sm text-gray-600 hover:text-gray-900 font-medium px-1 flex items-center">
      {label}
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {/* Dropdown content would go here */}
  </div>
);

export default Navbar; 