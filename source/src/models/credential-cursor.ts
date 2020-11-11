import { CredentialSortOptions, CredentialStage, PaginationValues, PopulateStrategy } from '../config/types';
import { integerParser, stringParser, toObjectId } from '../lib/parsers';
import { ModelBase, ObjectId, prop } from './base';

/**
 * Credential cursor model for constructing conditions for listing communities.
 */
export class CredentialCursor extends ModelBase {
  /**
   * Defines the `skip` field.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateStrategy.PROFILE],
    setter(v) {
      return v < 0 ? 0 : v;
    },
    defaultValue: 0,
  })
  public skip: number;

  /**
   * Defines the `limit` field.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateStrategy.PROFILE],
    setter(v) {
      if (v < 1) { v = PaginationValues.PAGE_DEFAULT_LIMIT; }
      if (v > PaginationValues.PAGE_MAX_LIMIT) { v = PaginationValues.PAGE_MAX_LIMIT; }
      return v;
    },
    defaultValue: PaginationValues.PAGE_DEFAULT_LIMIT,
  })
  public limit: number;

  /**
   * Defines the `searchNgrams` fields.
   */
  @prop({
    parser: { resolver: stringParser() },
  })
  public searchNgrams: string;

  /**
   * Defines the `search` field.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    setter(v) {
      this.searchNgrams = v;
      return v;
    },
  })
  public search: string;

  /**
   * Defines the `filterProfileIds` field.
   */
  @prop({
    parser: { resolver: stringParser(), array: true },
    populatable: [PopulateStrategy.PROFILE],
  })
  public filterProfileIds: string[];

  /**
   * Defines the `filterCommunityIds` field.
   */
  @prop({
    parser: { resolver: stringParser(), array: true },
    populatable: [PopulateStrategy.PROFILE],
  })
  public filterCommunityIds: string[];

  /**
   * Defines the `filterTags` field.
   */
  @prop({
    parser: { resolver: stringParser(), array: true },
    setter(v) { return v === null ? null : v.map((tag) => tag.toLowerCase()); },
    populatable: [PopulateStrategy.PROFILE],
  })
  public filterTags: string[];

  /**
   * Defines the `filterStages` field.
   */
  @prop({
    parser: { resolver: integerParser(), array: true },
    populatable: [PopulateStrategy.PROFILE],
  })
  public filterStages: CredentialStage[];

  /**
   * Defines the `filterIds` field.
   */
  @prop({
    setter(v) {
      return v.map((id: string) => toObjectId(id));
    },
    populatable: [PopulateStrategy.PROFILE],
  })
  public filterIds: ObjectId[];

  /**
   * Defines the `filterAchievementIds` field.
   */
  @prop({
    setter(v) {
      return v.map((id: string) => toObjectId(id));
    },
    populatable: [PopulateStrategy.PROFILE],
  })
  public filterAchievementIds: ObjectId[];

  /**
   * Defines the `sort` field.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateStrategy.PROFILE],
  })
  public sort: number;

  /**
   * Returns MongoDB condition for querying communities.
   */
  public buildQuery() {
    const query = {} as any;

    if (this.searchNgrams) {
      query['$text'] = { $search: this.searchNgrams };
    }
    if (this.filterIds) {
      query['_id'] = { $in: this.filterIds };
    }
    if (this.filterAchievementIds) {
      query['achievement._id'] = { $in: this.filterAchievementIds };
    }
    if (this.filterProfileIds) {
      query['profileId'] = { $in: this.filterProfileIds };
    }
    if (this.filterCommunityIds) {
      query['achievement.communityId'] = { $in: this.filterCommunityIds };
    }
    if (this.filterTags) {
      query['achievement.tag'] = { $elemMatch: { $in: this.filterTags }};
    }
    if (this.filterStages) {
      query['stage'] = { $in: this.filterStages };
    }
    return query;
  }

  /**
   * Returns MongoDB condition which prevents listing deleted documents.
   */
  public buildPersistentFilter() {
    return {
      '_deletedAt': null,
    } as any;
  }

  /**
   * Returns MongoDB condition for sorting communities.
   */
  public buildSort() {
    const data = {};

    if (this.searchNgrams !== null) {
      data['score'] = { $meta: 'textScore' };
    }

    if (this.sort === CredentialSortOptions.ACHIEVEMENT_NAME_ASC) {
      data['achievement.name'] = 1;
    }

    if (this.sort === CredentialSortOptions.ACHIEVEMENT_NAME_DESC) {
      data['achievement.name'] = -1;
    }

    if (this.sort === CredentialSortOptions.STATE_ASC) {
      data['state'] = 1;
    }

    if (this.sort === CredentialSortOptions.STATE_DESC) {
      data['state'] = -1;
    }

    if (Object.keys(data).length === 0) {
      data['_id'] = -1;
    }

    return data;
  }

}
