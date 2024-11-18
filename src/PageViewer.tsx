import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ReactSVG } from "react-svg";
import "./PageViewer.css"

interface Chapter {
  href: string;
  title?: string; // Optional title
}

function PageViewer() {
  const location = useLocation();
  const chapters = location.state.chapters;
  const index = location.state.index;
  const folderPath = location.state.folderPath

  const [currentChapter, setCurrentChapter] = useState<number>(index);
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    const fetchContent = async () => {
      const response = await fetch(folderPath + chapters[currentChapter].href);
      const text = await response.text();
      const result = text.replaceAll("../", `${folderPath}/`);
      setContent(result);
      console.log(result)
    };

    fetchContent();
  }, [currentChapter, chapters]);

  function nextChap() {
    if (currentChapter < chapters.length - 1) {
      setCurrentChapter(currentChapter + 1);
    }
  }

  function prevChap() {
    if (currentChapter > 0) {
      setCurrentChapter(currentChapter - 1);
    }
  }

  return (

    <>
      <div className="flex justify-between w-full min-w-full px-24 py-16 box-border">
        <button className="navButton" onClick={prevChap} disabled={currentChapter === 0}>
          Previous
        </button>
        <button className="text-uppercase bg-[#070707] font-bold text-2xl border-1 border-solid
          border-[#333752] rounded-md px-3 py-2 max-w-[150px] min-w-[150px] transition-colors duration-250 
          ease-in-out hover:bg-[#7AA2F7] hover:border-[#7AA2F7] hover:text-[#070707]">
          <a href="/" className='px-0'>
            Home
          </a>
        </button>
        <button className="navButton" onClick={nextChap} disabled={currentChapter === chapters.length - 1}>
          Next
        </button>
      </div>
      <div className="text-left w-11/12 mx-auto text-[22pt] leading-[150%]">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
      <div className="flex justify-between w-full min-w-full px-24 py-16 box-border">
        <button className="navButton" onClick={prevChap} disabled={currentChapter === 0}>
          Previous
        </button>
        <button className="navButton">
          <a href="/" className="hover:text-blue-500 underline underline-offset-2">
            Home
          </a>
        </button>
        <button className="navButton" onClick={nextChap} disabled={currentChapter === chapters.length - 1}>
          Next
        </button>
      </div>
      <button className="fixed bottom-5 right-5 bg-blue-600 text-white cursor-pointer w-[90px] h-[90px] border-blue-600 rounded-full z-50 flex items-center justify-center transition-colors duration-300 hover:bg-blue-700">
        <svg width="70px" height="70px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.84308 20.1979C9.8718 21.3993 10.8862 22 12 22C13.1138 22 14.1282 21.3993 16.1569 20.1979L16.8431 19.7915C18.8718 18.5901 19.8862 17.9894 20.4431 17C21 16.0106 21 14.8092 21 12.4063M20.8147 8C20.7326 7.62759 20.6141 7.3038 20.4431 7C19.8862 6.01057 18.8718 5.40987 16.8431 4.20846L16.1569 3.80211C14.1282 2.6007 13.1138 2 12 2C10.8862 2 9.8718 2.6007 7.84308 3.80211L7.15692 4.20846C5.1282 5.40987 4.11384 6.01057 3.55692 7C3 7.98943 3 9.19084 3 11.5937V12.4063C3 14.8092 3 16.0106 3.55692 17C3.78326 17.4021 4.08516 17.74 4.5 18.0802" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" />
          <circle cx="12" cy="12" r="3" stroke="#1C274C" stroke-width="1.5" />
        </svg>
      </button>
    </>


  );
}

export default PageViewer;


