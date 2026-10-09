# Data Sets

## topLanguages.ts

`topLanguages.ts` exports an array named `topLanguages` containing common languages ordered by total number of speakers. The order is descending so the most widely spoken languages appear first. Import this file in any script that needs a consistent list of language names:

```ts
import { topLanguages } from '../data/topLanguages';
```

This dataset is currently used by `server/scripts/bulkCreateLanguageTutors.ts` to generate example agents, but it can be reused for other tasks as well.

## Populating the Database with Language Tutors

Follow these steps to add the example language tutor templates to your database:

1. Make sure the `DATABASE_URL` environment variable is configured and that the database is reachable.
2. Run the seed script:

```bash
npm run seed:languages
```

The script creates 100 language tutor templates using the languages listed in `server/data/topLanguages.ts`. Edit that file if you want to customize which tutors are generated.
