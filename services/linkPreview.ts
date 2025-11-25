
import { LinkPreview } from '../types';

/**
 * ENHANCED Link Preview Service
 * 
 * 1. YouTube: Extracts real thumbnails from video IDs.
 * 2. Direct Images: Detects .jpg/.png links and uses them as previews.
 * 3. Social Media: Provides clean fallbacks for Facebook/Twitter since real scraping requires a backend (Supabase Edge Function).
 */

export const fetchLinkPreview = async (url: string): Promise<LinkPreview | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const cleanUrl = url.trim();
        const urlObj = new URL(cleanUrl);
        const domain = urlObj.hostname.replace('www.', '');
        
        // 1. Handle YouTube (We CAN get real thumbnails here)
        if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
          let videoId = '';
          if (domain.includes('youtu.be')) {
            videoId = urlObj.pathname.slice(1);
          } else {
            videoId = urlObj.searchParams.get('v') || '';
          }

          if (videoId) {
            resolve({
              url: cleanUrl,
              title: 'YouTube Video',
              description: 'Watch this video on YouTube.',
              imageUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, // REAL Thumbnail
              domain: 'youtube.com'
            });
            return;
          }
        }

        // 2. Handle Direct Image Links
        if (cleanUrl.match(/\.(jpeg|jpg|gif|png)$/) != null) {
          resolve({
            url: cleanUrl,
            title: 'Shared Image',
            description: 'Click to view full size image.',
            imageUrl: cleanUrl,
            domain: domain
          });
          return;
        }

        // 3. Handle Facebook (CORS blocks scraping, so we use a clean fallback)
        if (domain.includes('facebook.com') || domain.includes('fb.watch')) {
          resolve({
            url: cleanUrl,
            title: 'Facebook Post',
            description: 'View this post on Facebook.',
            // Generic Social Placeholder
            imageUrl: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&w=800&q=80', 
            domain: 'facebook.com'
          });
          return;
        }

        // 4. Handle Twitter/X
        if (domain.includes('twitter.com') || domain.includes('x.com')) {
          resolve({
            url: cleanUrl,
            title: 'X (Twitter) Post',
            description: 'View this conversation on X.',
            imageUrl: 'https://images.unsplash.com/photo-1611605698383-3b8cf24c4ece?auto=format&fit=crop&w=800&q=80',
            domain: 'x.com'
          });
          return;
        }

        // 5. Specific Mock for DOH (Government)
        if (url.includes('doh.gov')) {
           resolve({
            url: cleanUrl,
            title: 'Department of Health Advisory',
            description: 'Official public health guidelines and updates.',
            imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
            domain: 'doh.gov.ph'
          });
          return;
        }

        // 6. Generic Fallback
        resolve({
          url: cleanUrl,
          title: `Link: ${domain}`,
          description: 'Click to visit the external link.',
          imageUrl: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=800&q=80',
          domain: domain
        });

      } catch (e) {
        console.error("Link parse error", e);
        resolve(null);
      }
    }, 1000);
  });
};
