import React, { useState } from 'react';

const NewsletterSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  return (
    <section className="blog-newsletter">
      <div>
        <h3>Dapatkan Tips Writing Mingguan</h3>
        <p>Insight penerbitan, strategi promosi, dan update terbaru langsung ke email Anda.</p>
      </div>
      <form
        className="blog-newsletter__form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!email.trim()) return;
          setDone(true);
          setEmail('');
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@email.com"
        />
        <button type="submit">Subscribe</button>
      </form>
      <small>{done ? 'Terima kasih, Anda sudah terdaftar.' : 'Kami menjaga privasi Anda, tanpa spam.'}</small>
    </section>
  );
};

export default NewsletterSignup;
