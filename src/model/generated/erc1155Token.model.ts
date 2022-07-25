import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {ERC1155TokenOwner} from "./erc1155TokenOwner.model"
import {Metadata} from "./metadata.model"
import {ERC1155Transfer} from "./erc1155Transfer.model"
import {ERC1155Contract} from "./erc1155Contract.model"

@Entity_()
export class ERC1155Token {
  constructor(props?: Partial<ERC1155Token>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
  totalSupply!: bigint | undefined | null

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  numericId!: bigint

  @OneToMany_(() => ERC1155TokenOwner, e => e.token)
  owners!: ERC1155TokenOwner[]

  @Column_("text", {nullable: true})
  uri!: string | undefined | null

  @Index_()
  @ManyToOne_(() => Metadata, {nullable: true})
  meta!: Metadata | undefined | null

  @OneToMany_(() => ERC1155Transfer, e => e.token)
  transfers!: ERC1155Transfer[]

  @Index_()
  @ManyToOne_(() => ERC1155Contract, {nullable: true})
  contract!: ERC1155Contract | undefined | null
}
