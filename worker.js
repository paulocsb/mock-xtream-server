// Cloudflare Worker: mock of the Xtream Codes Player API for testing IPTV clients.
//
// Same behavior as the Express version (server.js) but written for the Workers
// runtime (a fetch handler, not app.listen). Serves PUBLIC-DOMAIN /
// Creative-Commons content only. Any username/password is accepted.
//
// Deploy:  wrangler login  &&  wrangler deploy
// Point your client at the resulting URL with any username/password.

const MP4 = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample";
const MOVIE_TARGET = {
  101: `${MP4}/BigBuckBunny.mp4`,
  102: `${MP4}/ElephantsDream.mp4`,
  103: `${MP4}/Sintel.mp4`,
  104: `${MP4}/TearsOfSteel.mp4`,
  105: `${MP4}/ForBiggerBlazes.mp4`,
};
const LIVE_TARGET = {
  201: "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_adv_example_hevc/master.m3u8",
  202: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  203: "https://test-streams.mux.dev/test_001/stream.m3u8",
};
const EPISODE_TARGET = {
  "301": `${MP4}/ForBiggerFun.mp4`,
  "302": `${MP4}/ForBiggerJoyrides.mp4`,
};

const poster = (id) => `https://picsum.photos/seed/iptv${id}/400/600`;
const NOW = "1700000000";
const FUTURE = "1999999999";

const MOVIE_CATEGORIES = [{ category_id: "1", category_name: "Open Movies", parent_id: 0 }];
const SERIES_CATEGORIES = [{ category_id: "10", category_name: "Sample Series", parent_id: 0 }];
const LIVE_CATEGORIES = [{ category_id: "20", category_name: "Test Channels", parent_id: 0 }];

const MOVIES = [
  ["Big Buck Bunny", 101, 4.5], ["Elephant's Dream", 102, 4.0],
  ["Sintel", 103, 4.7], ["Tears of Steel", 104, 4.2],
  ["For Bigger Blazes", 105, 3.8],
].map(([name, id, rating], i) => ({
  num: i + 1, name, stream_type: "movie", stream_id: id,
  stream_icon: poster(id), rating_5based: rating, added: NOW,
  is_adult: "0", category_id: "1", container_extension: "mp4",
  custom_sid: null, direct_source: "",
}));

const SERIES = [{
  num: 1, name: "Sample Series", series_id: 500, cover: poster(500),
  plot: "A short demo series assembled from Creative Commons clips.",
  cast: "Sample Cast", director: "Sample Director", genre: "Demo",
  releaseDate: "2020-01-01", last_modified: NOW, rating: "8",
  rating_5based: 4.0, youtube_trailer: "", episode_run_time: "10",
  category_id: "10",
}];

const LIVES = [
  ["Apple Test Channel", 201], ["Mux Test Channel", 202], ["Open HLS Channel", 203],
].map(([name, id], i) => ({
  num: i + 1, name, stream_type: "live", stream_id: id,
  stream_icon: poster(id), epg_channel_id: null, added: NOW,
  is_adult: "0", category_id: "20", custom_sid: null,
  tv_archive: 0, direct_source: "",
}));

const DISPOSITION = {
  default: 1, dub: 0, original: 0, comment: 0, lyrics: 0, karaoke: 0,
  forced: 0, hearing_impaired: 0, visual_impaired: 0, clean_effects: 0,
  attached_pic: 0, timed_thumbnails: 0,
};
const VIDEO = {
  index: 0, codec_name: "h264", codec_long_name: "H.264", profile: "High",
  codec_type: "video", codec_time_base: "1/50", codec_tag_string: "avc1",
  codec_tag: "0x31637661", width: 1920, height: 1080, coded_width: 1920,
  coded_height: 1080, has_b_frames: 2, sample_aspect_ratio: "1:1",
  display_aspect_ratio: "16:9", pix_fmt: "yuv420p", level: 40,
  chroma_location: "left", refs: 1, is_avc: "true", nal_length_size: "4",
  r_frame_rate: "25/1", avg_frame_rate: "25/1", time_base: "1/12800",
  start_pts: 0, start_time: "0.000000", duration_ts: 7680000,
  duration: "600.000000", bit_rate: "2000000", bits_per_raw_sample: "8",
  nb_frames: "15000", disposition: DISPOSITION,
  tags: { language: "und", handler_name: "VideoHandler" },
};
const AUDIO = {
  index: 1, codec_name: "aac", codec_long_name: "AAC", profile: "LC",
  codec_type: "audio", codec_time_base: "1/44100", codec_tag_string: "mp4a",
  codec_tag: "0x6134706d", sample_fmt: "fltp", sample_rate: "44100",
  channels: 2, channel_layout: "stereo", bits_per_sample: 0,
  r_frame_rate: "0/0", avg_frame_rate: "0/0", time_base: "1/44100",
  start_pts: 0, start_time: "0.000000", duration_ts: 26460000,
  duration: "600.000000", bit_rate: "128000", max_bit_rate: "128000",
  nb_frames: "25840", disposition: DISPOSITION,
  tags: { language: "und", handler_name: "SoundHandler" },
};

function movieInfo(movie) {
  return {
    movie_image: movie.stream_icon, tmdb_id: "", backdrop: movie.stream_icon,
    youtube_trailer: "", genre: "Open Movie",
    plot: `${movie.name} — a Creative Commons short used here as sample content.`,
    cast: "Sample Cast", rating: "8", director: "Sample Director",
    releasedate: "2020-01-01", backdrop_path: [movie.stream_icon],
    duration_secs: 600, duration: "00:10:00", video: VIDEO, audio: AUDIO,
    bitrate: 2000,
  };
}

function accountInfo(username, password) {
  return {
    user_info: {
      username, password, status: "Active", max_connections: "5",
      created_at: NOW, exp_date: FUTURE,
    },
    server_info: { url: "", port: "80", https_port: "443", server_protocol: "https" },
  };
}

const json = (obj) =>
  new Response(JSON.stringify(obj), { headers: { "content-type": "application/json" } });

const idFromFile = (file) => (file || "").split(".")[0];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const q = url.searchParams;

    if (path === "/player_api.php") {
      const username = q.get("username") || "review";
      const password = q.get("password") || "review";
      const action = q.get("action");

      switch (action) {
        case null:                    return json(accountInfo(username, password));
        case "get_vod_categories":    return json(MOVIE_CATEGORIES);
        case "get_vod_streams":       return json(MOVIES);
        case "get_series_categories": return json(SERIES_CATEGORIES);
        case "get_series":            return json(SERIES);
        case "get_live_categories":   return json(LIVE_CATEGORIES);
        case "get_live_streams":      return json(LIVES);

        case "get_vod_info": {
          const movie = MOVIES.find((m) => String(m.stream_id) === String(q.get("vod_id"))) || MOVIES[0];
          return json({
            info: movieInfo(movie),
            movie_data: {
              stream_id: movie.stream_id, name: movie.name, added: NOW,
              category_id: movie.category_id, container_extension: "mp4",
              custom_sid: "", direct_source: "",
            },
          });
        }

        case "get_series_info":
          return json({
            seasons: [{
              air_date: "2020-01-01", episode_count: 2, id: 1, name: "Season 1",
              overview: "Sample season.", season_number: 1,
              cover: poster(500), cover_big: poster(500),
            }],
            info: SERIES[0],
            episodes: {
              "1": [
                { id: "301", episode_num: 1, title: "For Bigger Fun", container_extension: "mp4",
                  info: { movie_image: poster(301), plot: "Sample episode one.", releasedate: "2020-01-01" },
                  custom_sid: "", added: NOW, season: 1, direct_source: "" },
                { id: "302", episode_num: 2, title: "For Bigger Joyrides", container_extension: "mp4",
                  info: { movie_image: poster(302), plot: "Sample episode two.", releasedate: "2020-01-01" },
                  custom_sid: "", added: NOW, season: 1, direct_source: "" },
              ],
            },
          });

        default:
          return json([]);
      }
    }

    let m;
    if ((m = path.match(/^\/movie\/[^/]+\/[^/]+\/([^/]+)$/))) {
      const url2 = MOVIE_TARGET[Number(idFromFile(m[1]))];
      return url2 ? Response.redirect(url2, 302) : new Response("Not found", { status: 404 });
    }
    if ((m = path.match(/^\/live\/[^/]+\/[^/]+\/([^/]+)$/))) {
      const url2 = LIVE_TARGET[Number(idFromFile(m[1]))];
      return url2 ? Response.redirect(url2, 302) : new Response("Not found", { status: 404 });
    }
    if ((m = path.match(/^\/series\/[^/]+\/[^/]+\/([^/]+)$/))) {
      const url2 = EPISODE_TARGET[idFromFile(m[1])];
      return url2 ? Response.redirect(url2, 302) : new Response("Not found", { status: 404 });
    }

    if (path === "/") {
      return new Response("IPTV mock Xtream server (Cloudflare Worker) — OK. Use any username/password.", {
        headers: { "content-type": "text/plain" },
      });
    }
    return new Response("Not found", { status: 404 });
  },
};
