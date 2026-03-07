import { reddit } from '@devvit/web/server';

export const createPost = async () => {
  return await reddit.submitCustomPost({
    title: 'Media Diary — Track What You Watch, Read & Listen To',
  });
};
