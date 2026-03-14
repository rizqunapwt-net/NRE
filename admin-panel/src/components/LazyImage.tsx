import React from 'react';
import { useInView } from 'react-intersection-observer';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  placeholder?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', className, ...props }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
  });

  return (
    <img
      ref={ref}
      src={inView ? src : placeholder}
      alt={alt}
      className={`${className} ${!inView ? 'image-loading' : 'image-loaded'}`}
      style={{
        transition: 'opacity 0.3s ease-in-out',
        opacity: inView ? 1 : 0.5,
        filter: inView ? 'none' : 'blur(5px)',
        ...props.style
      }}
      {...props}
    />
  );
};

export default LazyImage;
