// BookPage.tsx
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import './book-page.css'


interface Chapter {
  href: string;
  title?: string; // Optional title
}

function BookPage() {
  const [book, setBook] = useState(Array);
  const [error, setError] = useState<any>(null);
  const [nameString, setNameString] = useState('');
  const [titleBook, setTitleBook] = useState('');
  const [blurb, setBlurb] = useState('');

  const location = useLocation();
  const manifest = location.state.manifest;
  const folderPath = location.state.epubPath



  async function readManifest(url: string) {
    try {
      const { data: bookData } = await axios.get(url);
      const author = bookData['metadata']['author']['sortAs'];
      setNameString(author.split(',').at(-1) + ' ' + author.split(',').at(0));
      setTitleBook(bookData['metadata']['title']);
      setBlurb(bookData['metadata']['description']);

      if (!bookData || !bookData['toc']) {
        console.error('Error: invalid manifest', bookData);
        return [];
      }

      const chapters = Array();
      let count = 0;

      for (let item of bookData['toc']) {
        item['index'] = count;
        if (item.children) {
          for (let child of item.children) {
            count += 1;
            child['index'] = count;
            chapters.push(child);
          }
        } else {
          count += 1;
          chapters.push(item);
        }
      }

      return chapters;
    } catch (err) {
      console.error('Error reading manifest:', err);
      throw err;
    }
  }

  useEffect(() => {
    const fetchBookData = async () => {
      try {
        const bookData = await readManifest(manifest);
        setBook(bookData);
      } catch (err: any) {
        setError(err);
      }
    };

    fetchBookData();
  }, []);

  return (
    <>
      <h1 className="text-center text-4xl font-bold text-[#d9d7d7] mt-0 mb-4 font-[Bricolage Grotesque 96pt Condensed] animate-[rainbow-text_25s_infinite]">
        {titleBook}
      </h1>
      <h3 className="text-[#fab387] text-2xl mx-auto w-[60%] mb-5">
        Author: {nameString}
      </h3>
      <div dangerouslySetInnerHTML={{ __html: blurb }} className="blurbDiv mx-auto w-[60%]" />

      <div className="bookPageDiv mx-auto w-[60%]">
        {error ? (
          <p className="text-red-500">Error loading book data: {error.message}</p>
        ) : (
          <ul>
            {book.map((chapter, index) => (
              <li key={index} className="text-[#d9d7d7] text-xl font-[Bricolage Grotesque Regular] py-1">
                <Link
                  to="/books/view"
                  state={{ chapters: book, index, folderPath: folderPath }}
                  className="text-[#b4befe] text-3xl underline underline-offset-3 decoration-1 transition-colors duration-250 ease-in-out hover:text-[#f7768e] focus:text-[#f7768e] hover:decoration-2 focus:decoration-2 hover:decoration-dotted focus:decoration-dotted"
                >
                  {chapter.title || 'Untitled Chapter'}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default BookPage;

