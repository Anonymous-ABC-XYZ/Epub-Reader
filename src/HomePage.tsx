/// <reference types="vite-plugin-svgr/client" />
import React, { useEffect, useState } from 'react';
import Logo from '../public/plus-svgrepo-com.svg?react'
import Popup from 'reactjs-popup';
import './HomePage.css'
import { Link } from 'react-router-dom';

function HomePage() {
  const [parsedJson, setParsedJson] = useState(Array);
  const [epubPath, setEpubPath] = useState('');
  const [epubName, setEpubName] = useState('');

  async function handleUnpack() {
    console.log(epubPath)
    console.log(epubName)
    if (epubPath && epubName) {
      try {
        var resultingData = await window.ipcRenderer.unpackEpub(epubPath, epubName);
        console.log(resultingData)
        console.log('EPUB unpacked successfully');
      } catch (error) {
        console.error('Failed to unpack EPUB:', error);
      }
    } else {
      console.error('Please provide both the EPUB path and name.');
    }
  };

  useEffect(() => {
    async function fetchJson() {
      const data = await window.ipcRenderer.readJson();
      setParsedJson(data);
    };

    fetchJson();
  }, []);

  console.log(parsedJson)
  return (
    <>



      <div className='books-container absolute top-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-20 px-16 place-content-start'>
        {parsedJson.map((book: any, index) => (
          <div key={index} className='bg-gray-900 content-center rounded-lg w-72 h-96'>
            <Link to='/books' state={{ epubName: book.title, epubPath: book.href, manifest: book.manifest }} >
              <img src={book.cover} alt={`${book.title} cover`} className='h-72' />
            </Link>
            <h3 className='text-2xl text-center font-[BricolageGrotesque96ptCondensed-Bold] text-lime-400'>{book.title}</h3>
          </div>
        ))}
      </div>


      <div>
        <Popup trigger={
          <button className="settingsButton">
            <Logo />
          </button>
        } modal nested>
          {
            close => (
              <div className='modal bg-indigo-950 rounded-2xl w-full px-5 py-5 pt-1 pb-8'>
                <div className='input'>
                  <h2 className='decoration-amber-600 text-center'>Enter the path to the book and the name of the book</h2>
                </div>
                <div className='p-10 text-l subpixel-antialiased rounded-2xl shadow-6xl font-mono'>
                  <label className='text-2xl decoration-zinc-300'>Path</label>
                  <input
                    type="text"
                    className='w-full bg-stone-200 min-h-9 text-xl font-mono text-slate-950'
                    value={epubPath}
                    onChange={(e) => setEpubPath(e.target.value)}
                  />
                </div>
                <div className='p-10 text-l subpixel-antialiased rounded-2xl shadow-6xl font-mono'>
                  <label className='text-2xl decoration-zinc-300'>Name of the Book</label>
                  <input
                    type="text"
                    className='w-full bg-stone-200 min-h-9 text-xl font-mono text-gray-800'
                    value={epubName}
                    onChange={(e) => setEpubName(e.target.value)}
                  />
                </div>
                <div className='flex justify-between'>
                  <button
                    className='bg-green-600 border-none rounded-lg p-3 font-bold text-xl mr-4'
                    onClick={handleUnpack}
                  >
                    Unpack EPUB
                  </button>
                  <button
                    className='bg-red-600 border-none rounded-lg p-3 font-bold text-xl'
                    onClick={() => close()}
                  >
                    Close modal
                  </button>
                </div>
              </div>
            )
          }
        </Popup>
      </div>

    </>
  );

}


export default HomePage
