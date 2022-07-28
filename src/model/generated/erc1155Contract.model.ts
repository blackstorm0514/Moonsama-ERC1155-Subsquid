import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {ERC1155Token} from "./erc1155Token.model"

@Entity_()
export class ERC1155Contract {
  constructor(props?: Partial<ERC1155Contract>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: true})
  name!: string | undefined | null

  @Column_("text", {nullable: true})
  symbol!: string | undefined | null

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
  totalSupply!: bigint | undefined | null

  @OneToMany_(() => ERC1155Token, e => e.contract)
  mintedTokens!: ERC1155Token[]

  @Column_("text", {nullable: true})
  contractURI!: string | undefined | null

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
  contractURIUpdated!: bigint | undefined | null

  @Column_("text", {nullable: true})
  address!: string | undefined | null

  @Column_("int4", {nullable: true})
  decimals!: number | undefined | null
}
