declare module "json2csv" {
  const json2csv: {
    parse: (data: unknown, opts?: { fields?: string[] }) => string;
  };
  export default json2csv;
}
