import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {ERC721Owner} from "./erc721Owner.model"
import {Metadata} from "./metadata.model"
import {ERC721Transfer} from "./erc721Transfer.model"
import {ERC721Contract} from "./erc721Contract.model"

@Entity_()
export class ERC721Token {
  constructor(props?: Partial<ERC721Token>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  numericId!: bigint

  @Index_()
  @ManyToOne_(() => ERC721Owner, {nullable: true})
  owner!: ERC721Owner | undefined | null

  @Column_("text", {nullable: true})
  uri!: string | undefined | null

  @Index_()
  @ManyToOne_(() => Metadata, {nullable: true})
  meta!: Metadata | undefined | null

  @OneToMany_(() => ERC721Transfer, e => e.token)
  transfers!: ERC721Transfer[]

  @Index_()
  @ManyToOne_(() => ERC721Contract, {nullable: true})
  contract!: ERC721Contract | undefined | null
}
