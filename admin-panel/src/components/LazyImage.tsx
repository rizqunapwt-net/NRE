import React from 'react';
import { useInView } from 'react-intersection-observer';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  placeholder?: string;
  eager?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 
  className,
  eager = false,
  ...props 
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
    skip: eager,
  });

  const shouldShow = eager || inView;

  return (
    <img
      ref={eager ? undefined : ref}
      src={shouldShow ? src : placeholder}
      alt={alt}
      className={`${className} ${!shouldShow ? 'image-loading' : 'image-loaded'}`}
      style={{
        transition: 'opacity 0.3s ease-in-out',
        opacity: shouldShow ? 1 : 0.5,
        filter: shouldShow ? 'none' : 'blur(5px)',
        ...props.style
      }}
      loading={eager ? 'eager' : 'lazy'}
      {...props}
    />
  );
};

export default LazyImage;
