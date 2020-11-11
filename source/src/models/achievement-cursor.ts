import { CommunityPermissionKind } from '../config/permissions';
import { AchievemenentSortOptions, PaginationValues, PopulateStrategy } from '../config/types';
import { integerParser, stringParser, toObjectId } from '../lib/parsers';
import { ModelBase, ObjectId, prop } from './base';
import { Profile } from './profile';

/**
 * Achievement cursor model for constructing conditions for listing communities.
 */
export class AchievementCursor extends ModelBase {
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
   * Defines the `filterCommunityIds` fields.
   */
  @prop({
    parser: { resolver: stringParser(), array: true },
    populatable: [PopulateStrategy.PROFILE],
  })
  public filterCommunityIds: string;

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
   * Defines the `filterTags` field.
   */
  @prop({
    parser: { resolver: stringParser(), array: true },
    setter(v) { return v === null ? null : v.map((tag) => tag.toLowerCase()); },
    populatable: [PopulateStrategy.PROFILE],
  })
  public filterTags: string[];

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
  public buildQuery(profile: Profile) {

    const profileCommunityIds = profile.communityAbilities.filter((a) => CommunityPermissionKind.READ_ACHIEVEMENT === a.kind)
      .map((a) => a.communityId);

    const conditions: any[] = [
      { communityId: { $in: profileCommunityIds } },
    ];

    if (this.filterCommunityIds) {
      conditions.push({ communityId: { $in: this.filterCommunityIds } });
    }

    if (this.filterIds) {
      conditions.push({ _id: { $in: this.filterIds } });
    }

    if (this.filterTags) {
      conditions.push({ tag: { $elemMatch: { $in: this.filterTags } } });
    }

    if (this.searchNgrams) {
      conditions.push({ $text: { $search: this.searchNgrams } });
    }

    return { $and: conditions };
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

    if (this.sort === AchievemenentSortOptions.NAME_ASC) {
      data['name'] = 1;
    }

    if (this.sort === AchievemenentSortOptions.NAME_DESC) {
      data['name'] = -1;
    }

    if (Object.keys(data).length === 0) {
      data['_id'] = -1;
    }

    return data;
  }

}
