const API_BASE_URL = "https://shadowban.hmpf.club/" as const;
const IGNORE_PAGE_PATHS_REGEX = new RegExp(
  /\/(?:(?:notification|i\/bookmark|message)s|(?:explor|hom)e)/
);

type ShadowbanStatus = {
  profile?: {
    error?: string | null;
    exists: boolean;
    has_tweets: boolean;
    id?: string;
    screen_name?: string;
    protected?: boolean;
    suspended?: boolean;
  };
  tests?: {
    ghost: {
      ban: boolean;
    };
    more_replies: {
      ban: boolean;
      in_reply_to: string;
      tweet: string;
    };
    search: boolean;
    typeahead: boolean;
  };
  timestamp?: number;
};

(async () => {
  await test();
})();

async function check(screenName: string): Promise<Response> {
  const url = new URL(`${API_BASE_URL}${screenName}`);
  return await fetch(url.href);
}

async function test() {
  const path = window.location.pathname;
  if (path.match(IGNORE_PAGE_PATHS_REGEX)) return;
  const screenName = path.replace("/", "");

  const result = document.createElement("div");
  result.style.color = "black";
  result.style.fontSize = "20px";

  // Check
  try {
    check(screenName).then(async (res) => {
      if (res.status != 200) {
        result.innerText = "[エラー] 取得に失敗しました。";
      } else {
        const status = await res.json() as ShadowbanStatus;
        if (status.profile && status.profile.protected) {
          result.innerText = "このアカウントは鍵アカウントです。";
        }
        if (status.profile && status.profile.suspended) {
          result.innerText = "このアカウントは凍結されています。";
        }
        if (status.profile && !status.profile.exists) {
            result.innerText = "アカウントが存在しません。";
        }
        if(status.tests){
            // Search Suggestion Ban と Search Ban は BAN のとき False を返却します。
            result.innerText = `Shadowban Status\n
                                Search Suggestion Ban: ${!status.tests.typeahead}\n
                                Search Ban: ${!status.tests.search}\n
                                Ghost Ban: ${status.tests.ghost.ban}\n
                                Reply Deboosting: ${status.tests.more_replies.ban}`
        }
      }
    });
  } catch (error) {
    result.innerText = "[エラー] 取得に失敗しました。";
  }
  const target = document.body || document.getElementsByTagName('body')[0];
  if(target !== null) {
    target.appendChild(result)
  }
}
