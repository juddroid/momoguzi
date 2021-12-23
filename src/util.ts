export const isValid = (keyword: string, keywordList: string[]): boolean => {
  const str = keyword.split(' ').join().trim();
  return Boolean(keywordList.find((keyword) => keyword === str));
};

export const isBot = (botID: string | undefined): boolean => Boolean(botID);

interface StoreProps {
  store: string;
  path: string;
}

export const getListFromJSON = (json: object): StoreProps[] => {
  let list = [];
  for (const key in json) {
    list = list.concat(json[key]);
  }
  return list;
};

export const getRandomNumber = (list: StoreProps[]): number => Math.floor(Math.random() * (list.length - 0)) + 0;
