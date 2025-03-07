import React, { useState, useCallback } from "react";
import { render } from "react-dom";
import Gallery from "../react-photo-gallery/src/Gallery";
import Carousel, { Modal, ModalGateway } from "react-images";
import { photos } from "../src/temp-photos";

function App() {
  const [currentImage, setCurrentImage] = useState(0);
  const [viewerIsOpen, setViewerIsOpen] = useState(false);

  const openLightbox = useCallback((event, { photo, index }) => {
    setCurrentImage(index);
    setViewerIsOpen(true);
  }, []);

  const closeLightbox = () => {
    setCurrentImage(0);
    setViewerIsOpen(false);
  };

  return (
    <div>
      <Gallery photos={photos} onClick={openLightbox} />
      <ModalGateway>
        {viewerIsOpen ? (
          <Modal onClose={closeLightbox}>
            <Carousel
              currentIndex={currentImage}
              views={
                photos.map(x => ({
                ...x,
                source: x.src,
                // srcset: x.srcSet,
                caption: x.title
              }))}
            />
          </Modal>
        ) : null}
      </ModalGateway>
    </div>
  );
}

render(<App />, document.getElementById("app"));
