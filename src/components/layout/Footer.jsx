import React from 'react';

export const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex justify-center md:justify-start space-x-6 md:order-2">
                        <a href="#" className="text-gray-400 hover:text-gray-500">
                            GitHub
                        </a>
                    </div>
                    <div className="mt-8 md:mt-0 md:order-1">
                        <p className="text-center text-base text-gray-400">
                            &copy; 2026 MedChain Decentralized Systems. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};
